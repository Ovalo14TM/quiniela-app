// src/components/admin/ResultsManagement.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getCurrentQuiniela } from '../../services/quinielaService';
import { updateMatchResult, calculateQuinielaStats, determineQuinielaWinners } from '../../services/scoringService';
import { createPaymentsFromQuiniela } from '../../services/paymentsService';
import { formatMatchDate } from '../../services/footballService';

export default function ResultsManagement() {
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [quinielaStats, setQuinielaStats] = useState(null);
  const [winners, setWinners] = useState(null);

  useEffect(() => {
    loadCurrentQuiniela();
  }, []);

  const loadCurrentQuiniela = async () => {
    setLoading(true);
    try {
      const quiniela = await getCurrentQuiniela();
      
      if (quiniela) {
        setCurrentQuiniela(quiniela);
        
        // Cargar partidos de la quiniela
        const quinielaMatches = await Promise.all(
          quiniela.matches.map(async (matchId) => {
            const matchRef = doc(db, 'matches', matchId);
            const matchSnap = await getDoc(matchRef);
            
            if (matchSnap.exists()) {
              return { id: matchSnap.id, ...matchSnap.data() };
            }
            return null;
          })
        );
        
        const validMatches = quinielaMatches.filter(match => match != null);
        setMatches(validMatches);
        
        // Cargar estadísticas si hay partidos terminados
        const stats = await calculateQuinielaStats(quiniela.id);
        setQuinielaStats(stats);
        
        // Calcular ganadores si todos los partidos están terminados
        const allFinished = validMatches.every(match => match.status === 'FINISHED');
        if (allFinished && validMatches.length > 0) {
          const winnersData = await determineQuinielaWinners(quiniela.id);
          setWinners(winnersData);
          
          // Crear pagos automáticamente si hay ganadores
          if (winnersData.winners.length > 0) {
            await createPaymentsFromQuiniela(quiniela.id, winnersData.winners, winnersData.ranking);
            console.log('💰 Pagos creados automáticamente para la quiniela');
          }
        }
      }
    } catch (error) {
      console.error('Error loading current quiniela:', error);
    }
    setLoading(false);
  };

  const handleUpdateResult = async (matchId, homeScore, awayScore) => {
    if (homeScore === '' || awayScore === '' || homeScore < 0 || awayScore < 0) {
      alert('Por favor ingresa resultados válidos');
      return;
    }

    setUpdating(matchId);
    try {
      const result = await updateMatchResult(matchId, homeScore, awayScore);
      
      alert(`✅ Resultado actualizado!\n📊 ${result.predictionsUpdated} predicciones calculadas\n👥 ${result.usersAffected} usuarios afectados`);
      
      // Recargar datos
      await loadCurrentQuiniela();
      
    } catch (error) {
      console.error('Error updating result:', error);
      alert('Error al actualizar el resultado');
    }
    setUpdating(null);
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
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '64px'
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
            Primero crea una quiniela para gestionar resultados
          </p>
        </div>
      </div>
    );
  }

  const finishedMatches = matches.filter(m => m.status === 'FINISHED').length;
  const progressPercentage = matches.length > 0 ? (finishedMatches / matches.length) * 100 : 0;

  return (
    <div style={{ color: 'white' }}>
      {/* Header */}
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 8px 0'
            }}>
              📊 Gestión de Resultados
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0
            }}>
              {currentQuiniela.title} - {matches.length} partidos
            </p>
          </div>
          
          <button
            onClick={loadCurrentQuiniela}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Progress */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'white'
            }}>
              Progreso de Resultados
            </span>
            <span style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              {finishedMatches} de {matches.length} completados
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: '4px'
          }}>
            {progressPercentage.toFixed(1)}% completado
          </div>
        </div>
      </div>

      {/* Lista de Partidos */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {matches.map((match, index) => (
          <MatchResultCard
            key={match.id}
            match={match}
            index={index}
            onUpdateResult={handleUpdateResult}
            updating={updating === match.id}
          />
        ))}
      </div>

      {/* Estadísticas de la Quiniela */}
      {quinielaStats && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📈 Estadísticas Actuales
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#3b82f6',
                margin: '0 0 8px 0'
              }}>
                {quinielaStats.totalUsers}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Participantes
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#10b981',
                margin: '0 0 8px 0'
              }}>
                {quinielaStats.totalPredictions}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Predicciones
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#f59e0b',
                margin: '0 0 8px 0'
              }}>
                {quinielaStats.userRanking[0]?.totalPoints || 0}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Puntaje Líder
              </div>
            </div>
          </div>

          {/* Ranking Actual */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>Posición</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>Usuario</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>Puntos</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>Precisión</th>
                </tr>
              </thead>
              <tbody>
                {quinielaStats.userRanking.map((user, index) => (
                  <tr key={user.userId} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  >
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 
                                   index === 1 ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 
                                   index === 2 ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 
                                   'rgba(255, 255, 255, 0.2)'
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: 'white'
                    }}>
                      Usuario {user.userId.slice(-6)}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      {user.totalPoints}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}>
                      {user.predictions > 0 ? `${user.correctResults}/${user.predictions}` : '0/0'}
                      {user.exactScores > 0 && (
                        <span style={{
                          marginLeft: '8px',
                          color: '#10b981'
                        }}>
                          ({user.exactScores} exactos)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ganadores y Pagos */}
      {winners && winners.winners.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            🏆 Ganadores y Pagos
          </h4>
          
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h5 style={{
              fontWeight: 'bold',
              color: '#10b981',
              margin: '0 0 8px 0'
            }}>
              🎉 ¡Ganadores de la Quiniela!
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {winners.winners.map(winner => (
                <div key={winner.userId} style={{
                  color: '#6ee7b7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  👑 Usuario {winner.userId.slice(-6)} - {winner.totalPoints} puntos
                </div>
              ))}
            </div>
          </div>

          {winners.payments.length > 0 && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h5 style={{
                fontWeight: 'bold',
                color: '#3b82f6',
                margin: '0 0 8px 0'
              }}>
                💰 Pagos a Realizar
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {winners.payments.map((payment, index) => (
                  <div key={index} style={{
                    color: '#93c5fd',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    💸 Usuario {payment.from.slice(-6)} debe pagar ${payment.amount} MXN a Usuario {payment.to.slice(-6)}
                    <span style={{
                      color: '#60a5fa',
                      marginLeft: '8px',
                      fontSize: '12px'
                    }}>
                      ({payment.reason})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

// Componente para cada partido
function MatchResultCard({ match, index, onUpdateResult, updating }) {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '');

  const isFinished = match.status === 'FINISHED';

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease'
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
            {isFinished && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}>
                ✅ Terminado
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

        {/* Formulario de Resultado */}
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
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={isFinished}
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
                  if (!isFinished) {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = 'white';
                  }
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
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={isFinished}
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
                  if (!isFinished) {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = 'white';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              />
            </div>
          </div>

          {/* Botón de Actualizar */}
          {!isFinished && (
            <button
              onClick={() => onUpdateResult(match.id, homeScore, awayScore)}
              disabled={updating || homeScore === '' || awayScore === ''}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: (updating || homeScore === '' || awayScore === '') ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!updating && homeScore !== '' && awayScore !== '') {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!updating) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {updating ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Actualizando...
                </>
              ) : (
                <>
                  ✅ Confirmar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}