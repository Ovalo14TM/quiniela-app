// src/components/user/PredictionsForm.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { getCurrentQuiniela, isQuinielaOpen, getTimeUntilDeadline } from '../../services/quinielaService';
import { getMatchesByWeek } from '../../services/matchesService';
import { getUserPredictionsForQuiniela, savePrediction } from '../../services/predictionsService';
import { formatMatchDate } from '../../services/footballService';
import { useAuth } from '../../context/AuthContext';

export default function PredictionsForm() {
  const { currentUser } = useAuth();
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    loadCurrentQuiniela();
  }, []);

  useEffect(() => {
    // Actualizar contador cada minuto
    const interval = setInterval(() => {
      if (currentQuiniela?.deadline) {
        const time = getTimeUntilDeadline(currentQuiniela.deadline);
        setTimeLeft(time);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentQuiniela]);

  const loadCurrentQuiniela = async () => {
    setLoading(true);
    try {
      const quiniela = await getCurrentQuiniela();
      
      if (quiniela) {
        setCurrentQuiniela(quiniela);
        
        // Cargar partidos de la quiniela
        const quinielaMatches = await Promise.all(
          quiniela.matches.map(async (matchId) => {
            const matchesFromWeek = await getMatchesByWeek(quiniela.id);
            return matchesFromWeek.find(m => m.id === matchId);
          })
        );
        
        // Filtrar matches válidos
        const validMatches = quinielaMatches.filter(match => match != null);
        setMatches(validMatches);
        
        // Cargar predicciones existentes del usuario
        const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, quiniela.id);
        setPredictions(userPredictions);
        
        // Calcular tiempo restante
        const time = getTimeUntilDeadline(quiniela.deadline);
        setTimeLeft(time);
      }
    } catch (error) {
      console.error('Error loading current quiniela:', error);
    }
    setLoading(false);
  };

  const handlePredictionChange = (matchId, field, value) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const savePredictionForMatch = async (matchId) => {
    const prediction = predictions[matchId];
    
    if (!prediction || prediction.homeScore === undefined || prediction.awayScore === undefined) {
      alert('Por favor completa ambos marcadores');
      return;
    }

    if (prediction.homeScore < 0 || prediction.awayScore < 0) {
      alert('Los marcadores no pueden ser negativos');
      return;
    }

    setSaving(true);
    try {
      await savePrediction({
        userId: currentUser.uid,
        matchId,
        quinielaId: currentQuiniela.id,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore
      });
      
      alert('Predicción guardada correctamente');
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Error al guardar la predicción');
    }
    setSaving(false);
  };

  const saveAllPredictions = async () => {
    const incompletePredictions = matches.filter(match => 
      !predictions[match.id] || 
      predictions[match.id].homeScore === undefined || 
      predictions[match.id].awayScore === undefined
    );

    if (incompletePredictions.length > 0) {
      alert(`Faltan ${incompletePredictions.length} predicciones por completar`);
      return;
    }

    setSaving(true);
    try {
      const savePromises = matches.map(match => 
        savePrediction({
          userId: currentUser.uid,
          matchId: match.id,
          quinielaId: currentQuiniela.id,
          homeScore: predictions[match.id].homeScore,
          awayScore: predictions[match.id].awayScore
        })
      );

      await Promise.all(savePromises);
      alert('¡Todas las predicciones guardadas correctamente!');
      
      // Recargar predicciones
      const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, currentQuiniela.id);
      setPredictions(userPredictions);
    } catch (error) {
      console.error('Error saving all predictions:', error);
      alert('Error al guardar las predicciones');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
          Cargando quiniela...
        </p>
      </div>
    );
  }

  if (!currentQuiniela) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '64px 32px'
      }}>
        <div style={{
          fontSize: '80px',
          marginBottom: '24px',
          opacity: 0.7
        }}>📋</div>
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 12px 0'
        }}>
          No hay quiniela activa
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px',
          margin: 0
        }}>
          El administrador aún no ha creado la quiniela de esta semana
        </p>
      </div>
    );
  }

  const isOpen = isQuinielaOpen(currentQuiniela);
  const completedPredictions = Object.keys(predictions).length;
  const totalPredictions = matches.length;

  return (
    <div>
      {/* Header de la Quiniela */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          gap: '16px'
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🏆 {currentQuiniela.title}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '6px 12px',
                borderRadius: '8px'
              }}>
                📅 {matches.length} partidos
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: completedPredictions === totalPredictions 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(245, 158, 11, 0.2)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: `1px solid ${completedPredictions === totalPredictions 
                  ? 'rgba(16, 185, 129, 0.4)' 
                  : 'rgba(245, 158, 11, 0.4)'}`
              }}>
                ✅ {completedPredictions}/{totalPredictions} completadas
              </span>
            </div>
          </div>
          
          <div style={{
            textAlign: 'right',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: timeLeft?.expired ? '#ef4444' : '#10b981',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⏰ {timeLeft?.text || 'Calculando...'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0
            }}>
              {isOpen ? 'Tiempo restante' : 'Quiniela cerrada'}
            </div>
          </div>
        </div>
        
        {!isOpen && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px'
          }}>
            <p style={{
              color: '#fca5a5',
              fontSize: '14px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Esta quiniela está cerrada. Ya no puedes modificar tus predicciones.
            </p>
          </div>
        )}
      </div>

      {/* Lista de Partidos */}
      <div style={{ marginBottom: '24px' }}>
        {matches.map((match, index) => {
          const matchPrediction = predictions[match.id] || {};
          const hasValidPrediction = matchPrediction.homeScore !== undefined && matchPrediction.awayScore !== undefined;
          
          return (
            <div key={match.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                gap: '20px'
              }}>
                {/* Info del Partido */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      {match.league}
                    </span>
                  </div>
                  
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 8px 0'
                  }}>
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    📅 {formatMatchDate(match.date)}
                  </p>
                </div>

                {/* Formulario de Predicción */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginBottom: '8px'
                      }}>
                        {match.homeTeam.split(' ').slice(-1)[0]}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={matchPrediction.homeScore || ''}
                        onChange={(e) => handlePredictionChange(match.id, 'homeScore', parseInt(e.target.value) || '')}
                        disabled={!isOpen}
                        style={{
                          width: '64px',
                          height: '48px',
                          textAlign: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        placeholder="0"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.background = 'white';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                        }}
                      />
                    </div>
                    
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      -
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginBottom: '8px'
                      }}>
                        {match.awayTeam.split(' ').slice(-1)[0]}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={matchPrediction.awayScore || ''}
                        onChange={(e) => handlePredictionChange(match.id, 'awayScore', parseInt(e.target.value) || '')}
                        disabled={!isOpen}
                        style={{
                          width: '64px',
                          height: '48px',
                          textAlign: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        placeholder="0"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.background = 'white';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                        }}
                      />
                    </div>
                  </div>

                  {/* Estado de la Predicción */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {hasValidPrediction ? (
                      <span style={{
                        color: '#10b981',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}>
                        ✅ Guardada
                      </span>
                    ) : (
                      <span style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ⏳ Pendiente
                      </span>
                    )}
                    
                    {isOpen && (
                      <button
                        onClick={() => savePredictionForMatch(match.id)}
                        disabled={saving || !predictions[match.id]?.homeScore === undefined}
                        style={{
                          fontSize: '12px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: saving ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!saving) {
                            e.target.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!saving) {
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        💾 Guardar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón para Guardar Todo */}
      {isOpen && matches.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
            gap: '16px'
          }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 8px 0'
              }}>
                Guardar Todas las Predicciones
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0
              }}>
                {completedPredictions}/{totalPredictions} predicciones completadas
              </p>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '3px',
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${totalPredictions > 0 ? (completedPredictions / totalPredictions) * 100 : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}>
                </div>
              </div>
            </div>
            
            <button
              onClick={saveAllPredictions}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: saving ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Guardando...
                </>
              ) : (
                <>
                  💾 Guardar Todo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}