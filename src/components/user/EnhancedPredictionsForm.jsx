// src/components/user/EnhancedPredictionsForm.jsx - Formulario completo con estadísticas de API

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuiniela } from '../../contexts/QuinielaContext';
import { getUserPredictionsForQuiniela, savePrediction } from '../../services/predictionsService';
import { getTeamLastMatches, calculateTeamStats } from '../../services/enhancedTeamStatsService';

// Componente de estadísticas de equipo mejorado
const EnhancedTeamStats = ({ teamName, isHome, league }) => {
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadTeamStats();
  }, [teamName]);

  const loadTeamStats = async () => {
    setLoading(true);
    try {
      const lastMatches = await getTeamLastMatches(teamName, 5);
      const teamStats = calculateTeamStats(lastMatches);
      setMatches(lastMatches);
      setStats(teamStats);
    } catch (error) {
      console.error('Error loading team stats:', error);
    }
    setLoading(false);
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'W': return '#10b981';
      case 'L': return '#ef4444';
      case 'D': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'W': return '✅';
      case 'L': return '❌';
      case 'D': return '⚖️';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Cargando estadísticas...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          No hay estadísticas disponibles
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease'
    }}>
      {/* Header con nombre y liga */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isHome ? '🏠' : '✈️'} {teamName}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '2px'
          }}>
            {league}
          </div>
        </div>
        
        {/* Forma reciente */}
        <div style={{
          display: 'flex',
          gap: '3px'
        }}>
          {stats.form.slice(0, 5).map((result, index) => (
            <div
              key={index}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: getResultColor(result),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                color: 'white'
              }}
              title={`${result === 'W' ? 'Victoria' : result === 'L' ? 'Derrota' : 'Empate'}`}
            >
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '8px',
          padding: '8px 4px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#10b981'
          }}>
            {stats.winPercentage}%
          </div>
          <div style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.2'
          }}>
            Victorias
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          background: 'rgba(59, 130, 246, 0.15)',
          borderRadius: '8px',
          padding: '8px 4px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#3b82f6'
          }}>
            {stats.averageGoalsFor}
          </div>
          <div style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.2'
          }}>
            Goles/P
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.15)',
          borderRadius: '8px',
          padding: '8px 4px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ef4444'
          }}>
            {stats.averageGoalsAgainst}
          </div>
          <div style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.2'
          }}>
            Goles/C
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          background: 'rgba(245, 158, 11, 0.15)',
          borderRadius: '8px',
          padding: '8px 4px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#f59e0b'
          }}>
            {stats.cleanSheets}
          </div>
          <div style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.2'
          }}>
            Vallas
          </div>
        </div>
      </div>

      {/* Botón para expandir */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '11px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'none';
          e.target.style.color = 'rgba(255, 255, 255, 0.7)';
        }}
      >
        {expanded ? '▲ Menos detalles' : '▼ Ver últimos partidos'}
      </button>

      {/* Detalles expandidos */}
      {expanded && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            Últimos {matches.length} partidos:
          </div>
          
          {matches.map((match, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                fontSize: '11px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1
              }}>
                <span style={{ color: getResultColor(match.result) }}>
                  {getResultIcon(match.result)}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {match.isHome ? 'vs' : '@'}
                </span>
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px'
                }}>
                  {match.opponent}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  color: match.result === 'W' ? '#10b981' : 
                         match.result === 'L' ? '#ef4444' : '#f59e0b',
                  fontWeight: 'bold',
                  minWidth: '30px',
                  textAlign: 'center'
                }}>
                  {match.teamScore}-{match.opponentScore}
                </span>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '9px',
                  minWidth: '35px'
                }}>
                  {match.date.toLocaleDateString('es', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Estadísticas adicionales */}
          <div style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            fontSize: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', fontWeight: 'bold' }}>{stats.wins}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Victorias</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>{stats.draws}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Empates</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{stats.losses}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Derrotas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal del formulario
export default function EnhancedPredictionsForm() {
  const { currentUser } = useAuth();
  const { currentQuiniela, matches } = useQuiniela();
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    if (currentUser && currentQuiniela) {
      loadPredictions();
    }
  }, [currentUser, currentQuiniela]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, currentQuiniela.id);
      setPredictions(userPredictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
    setLoading(false);
  };

  const isQuinielaOpen = (quiniela) => {
    if (!quiniela || !matches.length) return false;
    
    const now = new Date();
    const deadline = quiniela.deadline?.toDate ? quiniela.deadline.toDate() : new Date(quiniela.deadline);
    
    return now < deadline;
  };

  const formatMatchDate = (date) => {
    if (!date) return 'Fecha no disponible';
    
    try {
      const matchDate = date.toDate ? date.toDate() : new Date(date);
      return matchDate.toLocaleString('es-MX', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
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
    
    if (!prediction || 
        prediction.homeScore === undefined || prediction.homeScore === null || 
        prediction.awayScore === undefined || prediction.awayScore === null ||
        prediction.homeScore === '' || prediction.awayScore === '') {
      alert('Por favor completa ambos marcadores');
      return;
    }

    const homeScore = Number(prediction.homeScore);
    const awayScore = Number(prediction.awayScore);
    
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      alert('Los marcadores deben ser números válidos y no negativos');
      return;
    }

    setSaving(true);
    try {
      await savePrediction({
        userId: currentUser.uid,
        matchId,
        quinielaId: currentQuiniela.id,
        homeScore: homeScore,
        awayScore: awayScore
      });
      alert('✅ Predicción guardada');
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Error al guardar la predicción');
    }
    setSaving(false);
  };

  const saveAllPredictions = async () => {
    const incompletePredictions = matches.filter(match => {
      const prediction = predictions[match.id];
      return !prediction || 
             prediction.homeScore === undefined || prediction.homeScore === null || prediction.homeScore === '' ||
             prediction.awayScore === undefined || prediction.awayScore === null || prediction.awayScore === '' ||
             isNaN(Number(prediction.homeScore)) || isNaN(Number(prediction.awayScore));
    });

    if (incompletePredictions.length > 0) {
      alert(`Por favor completa todas las predicciones. Faltan ${incompletePredictions.length} partido(s).`);
      return;
    }

    setSaving(true);
    try {
      const savePromises = matches.map(match => {
        const prediction = predictions[match.id];
        return savePrediction({
          userId: currentUser.uid,
          matchId: match.id,
          quinielaId: currentQuiniela.id,
          homeScore: Number(prediction.homeScore),
          awayScore: Number(prediction.awayScore)
        });
      });

      await Promise.all(savePromises);
      alert('✅ Todas las predicciones guardadas');
      
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
        <div style={{ fontSize: '80px', marginBottom: '24px', opacity: 0.7 }}>📋</div>
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
  
  const completedPredictions = matches.filter(match => {
    const prediction = predictions[match.id];
    return prediction && 
           prediction.homeScore !== undefined && prediction.homeScore !== null && prediction.homeScore !== '' &&
           prediction.awayScore !== undefined && prediction.awayScore !== null && prediction.awayScore !== '' &&
           !isNaN(Number(prediction.homeScore)) && !isNaN(Number(prediction.awayScore));
  }).length;
  
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
          gap: '20px'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 8px 0'
            }}>
              🏆 {currentQuiniela.name}
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '0 0 4px 0',
              fontSize: '14px'
            }}>
              {currentQuiniela.description}
            </p>
            {currentQuiniela.leagues && (
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginTop: '8px'
              }}>
                {currentQuiniela.leagues.map(league => (
                  <span
                    key={league}
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#93c5fd',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {league}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: window.innerWidth < 768 ? 'flex-start' : 'flex-end',
            gap: '8px'
          }}>
            <div style={{
              background: isOpen 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isOpen ? '🟢 Abierta' : '🔴 Cerrada'}
            </div>
            
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '600'
            }}>
              {completedPredictions}/{totalPredictions} predicciones
            </div>
          </div>
        </div>
      </div>

      {/* Toggle para estadísticas */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          margin: 0
        }}>
          📋 Predicciones ({completedPredictions}/{totalPredictions})
        </h3>
        
        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            background: showStats 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s ease'
          }}
        >
          📊 {showStats ? 'Ocultar' : 'Mostrar'} Estadísticas
        </button>
      </div>

      {/* Lista de Partidos */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {matches.map((match, index) => {
          const matchPrediction = predictions[match.id] || {};
          const hasValidPrediction = matchPrediction.homeScore !== undefined && 
                                    matchPrediction.homeScore !== null && 
                                    matchPrediction.homeScore !== '' &&
                                    matchPrediction.awayScore !== undefined && 
                                    matchPrediction.awayScore !== null && 
                                    matchPrediction.awayScore !== '' &&
                                    !isNaN(Number(matchPrediction.homeScore)) && 
                                    !isNaN(Number(matchPrediction.awayScore));

          return (
            <div
              key={match.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                border: hasValidPrediction 
                  ? '2px solid rgba(16, 185, 129, 0.5)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Estadísticas de los equipos */}
              {showStats && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                  gap: '16px',
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px'
                }}>
                  <EnhancedTeamStats 
                    teamName={match.homeTeam} 
                    isHome={true} 
                    league={match.league}
                  />
                  <EnhancedTeamStats 
                    teamName={match.awayTeam} 
                    isHome={false} 
                    league={match.league}
                  />
                </div>
              )}

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
                    {match.round && (
                      <span style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {match.round}
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 8px 0'
                  }}>
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span>📅 {formatMatchDate(match.date)}</span>
                    {match.venue && (
                      <span>🏟️ {match.venue}</span>
                    )}
                  </div>
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
                        value={matchPrediction.homeScore !== undefined && matchPrediction.homeScore !== null ?
                          matchPrediction.homeScore : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            handlePredictionChange(match.id, 'homeScore', '');
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              handlePredictionChange(match.id, 'homeScore', numValue);
                            }
                          }
                        }}
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
                        placeholder=""
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
                        value={matchPrediction.awayScore !== undefined && matchPrediction.awayScore !== null ?
                          matchPrediction.awayScore : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            handlePredictionChange(match.id, 'awayScore', '');
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              handlePredictionChange(match.id, 'awayScore', numValue);
                            }
                          }
                        }}
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
                        placeholder=""
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
                      <>
                        <div style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontSize: '20px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          ✓
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: '#10b981',
                          fontWeight: '600'
                        }}>
                          Guardado
                        </span>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => savePredictionForMatch(match.id)}
                          disabled={!isOpen || saving}
                          style={{
                            background: isOpen 
                              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                              : 'rgba(156, 163, 175, 0.5)',
                            color: 'white',
                            border: 'none',
                            fontSize: '20px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            cursor: isOpen ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          💾
                        </button>
                        <span style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontWeight: '600'
                        }}>
                          Guardar
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón de Guardar Todo */}
      {isOpen && (
        <div style={{
          marginTop: '32px',
          textAlign: 'center'
        }}>
          <button
            onClick={saveAllPredictions}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
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
                Guardando predicciones...
              </>
            ) : (
              <>
                💾 Guardar Todas las Predicciones ({totalPredictions})
              </>
            )}
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}