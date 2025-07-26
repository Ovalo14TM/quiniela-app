// src/components/Rankings.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { getGlobalStats, getQuinielasHistory, getUserDetailedStats } from '../services/rankingsService';
import { useAuth } from '../context/AuthContext';

export default function Rankings() {
  const { currentUser } = useAuth();
  const [globalStats, setGlobalStats] = useState([]);
  const [quinielasHistory, setQuinielasHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stats, history] = await Promise.all([
        getGlobalStats(),
        getQuinielasHistory()
      ]);
      
      setGlobalStats(stats);
      setQuinielasHistory(history);
    } catch (error) {
      console.error('Error loading rankings data:', error);
    }
    setLoading(false);
  };

  const loadUserDetails = async (userId) => {
    try {
      const details = await getUserDetailedStats(userId);
      setUserDetails(details);
      setSelectedUser(userId);
      setActiveTab('userDetails');
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const TabButton = ({ tabId, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(tabId)}
      style={{
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isActive 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
          e.target.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'translateY(0)';
        }
      }}
    >
      {label}
    </button>
  );

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
          Cargando rankings...
        </p>
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Header y Navegación */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          🏆 Rankings y Estadísticas
        </h2>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <TabButton
            tabId="global"
            label="🌐 Ranking Global"
            isActive={activeTab === 'global'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="history"
            label="📚 Historial"
            isActive={activeTab === 'history'}
            onClick={setActiveTab}
          />
          {userDetails && (
            <TabButton
              tabId="userDetails"
              label={`👤 ${userDetails.user.name}`}
              isActive={activeTab === 'userDetails'}
              onClick={setActiveTab}
            />
          )}
        </div>
      </div>

      {/* Ranking Global */}
      {activeTab === 'global' && (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
          {/* Podium */}
          {globalStats.length >= 3 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 32px 0',
                textAlign: 'center'
              }}>
                🏆 Podium de Campeones
              </h3>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'end',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                {/* Segundo Lugar */}
                <div style={{
                  textAlign: 'center',
                  animation: 'slideIn 0.8s ease-out 0.2s both'
                }}>
                  <div style={{
                    width: '80px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    paddingBottom: '8px'
                  }}>
                    🥈
                  </div>
                  <div style={{
                    background: 'rgba(156, 163, 175, 0.2)',
                    padding: '12px',
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid rgba(156, 163, 175, 0.4)',
                    borderTop: 'none'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{globalStats[1]?.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {globalStats[1]?.totalPoints} pts
                    </div>
                  </div>
                </div>

                {/* Primer Lugar */}
                <div style={{
                  textAlign: 'center',
                  animation: 'slideIn 0.8s ease-out both'
                }}>
                  <div style={{
                    width: '96px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    paddingBottom: '8px',
                    position: 'relative'
                  }}>
                    🥇
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      👑
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(251, 191, 36, 0.2)',
                    padding: '16px',
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    borderTop: 'none'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{globalStats[0]?.name}</div>
                    <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold' }}>
                      {globalStats[0]?.totalPoints} pts
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                      👑 Campeón Actual
                    </div>
                  </div>
                </div>

                {/* Tercer Lugar */}
                <div style={{
                  textAlign: 'center',
                  animation: 'slideIn 0.8s ease-out 0.4s both'
                }}>
                  <div style={{
                    width: '80px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    paddingBottom: '8px'
                  }}>
                    🥉
                  </div>
                  <div style={{
                    background: 'rgba(234, 88, 12, 0.2)',
                    padding: '12px',
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid rgba(234, 88, 12, 0.4)',
                    borderTop: 'none'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{globalStats[2]?.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {globalStats[2]?.totalPoints} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla Completa de Rankings */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0'
            }}>
              📊 Ranking Completo
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px 0 0 8px'
                    }}>Pos</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Jugador</th>
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
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Exactos</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Ganancias</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '0 8px 8px 0'
                    }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {globalStats.map((user, index) => (
                    <tr 
                      key={user.id}
                      style={{
                        background: user.id === currentUser?.uid 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = user.id === currentUser?.uid 
                          ? 'rgba(59, 130, 246, 0.3)' 
                          : 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = user.id === currentUser?.uid 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px' }}>
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
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '4px'
                          }}>
                            {user.name}
                            {user.id === currentUser?.uid && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '12px',
                                background: 'rgba(59, 130, 246, 0.3)',
                                color: '#93c5fd',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '1px solid rgba(59, 130, 246, 0.4)'
                              }}>
                                Tú
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            {user.quinielasWon} quinielas ganadas
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {user.totalPoints}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>
                          {user.accuracy.toFixed(1)}%
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {user.correctPredictions}/{user.totalPredictions}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontWeight: 'bold',
                          color: '#10b981'
                        }}>
                          {user.exactScores}
                        </span>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {user.totalPredictions > 0 ? ((user.exactScores / user.totalPredictions) * 100).toFixed(1) : 0}%
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          color: user.totalWinnings >= 0 ? '#10b981' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          ${user.totalWinnings} MXN
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => loadUserDetails(user.id)}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          📊 Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Quinielas */}
      {activeTab === 'history' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📚 Historial de Quinielas
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {quinielasHistory.map((quiniela) => (
              <div key={quiniela.id} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '20px',
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
                  gap: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontWeight: 'bold',
                      color: 'white',
                      margin: '0 0 12px 0',
                      fontSize: '18px'
                    }}>
                      {quiniela.title}
                    </h4>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📅 {quiniela.createdAt?.toDate?.()?.toLocaleDateString('es-MX') || 'Fecha no disponible'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        👥 {quiniela.totalParticipants} participantes
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🎯 {quiniela.totalPredictions} predicciones
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      background: quiniela.status === 'finished' ? 'rgba(16, 185, 129, 0.2)' :
                                 quiniela.status === 'closed' ? 'rgba(245, 158, 11, 0.2)' :
                                 'rgba(59, 130, 246, 0.2)',
                      color: quiniela.status === 'finished' ? '#10b981' :
                             quiniela.status === 'closed' ? '#f59e0b' : '#3b82f6',
                      border: `1px solid ${quiniela.status === 'finished' ? 'rgba(16, 185, 129, 0.4)' :
                                          quiniela.status === 'closed' ? 'rgba(245, 158, 11, 0.4)' :
                                          'rgba(59, 130, 246, 0.4)'}`
                    }}>
                      {quiniela.status === 'finished' ? '✅ Terminada' :
                       quiniela.status === 'closed' ? '🔒 Cerrada' : '🔄 Activa'}
                    </div>
                    
                    {quiniela.winners.length > 0 && (
                      <div style={{ fontSize: '14px' }}>
                        <div style={{
                          fontWeight: 'bold',
                          color: 'white',
                          marginBottom: '4px'
                        }}>
                          🏆 Ganadores:
                        </div>
                        {quiniela.winners.map(winnerId => {
                          const winner = globalStats.find(u => u.id === winnerId);
                          return (
                            <div key={winnerId} style={{
                              color: '#fbbf24',
                              fontWeight: '600'
                            }}>
                              👑 {winner?.name || `Usuario ${winnerId.slice(-6)}`}
                            </div>
                          );
                        })}
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          Puntaje: {quiniela.topScore} pts
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Ranking de esa quiniela */}
                {quiniela.ranking.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginBottom: '8px'
                    }}>
                      📊 Ranking Final:
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      {quiniela.ranking.slice(0, 3).map((userRank, index) => {
                        const userData = globalStats.find(u => u.id === userRank.userId);
                        return (
                          <div key={userRank.userId} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '8px 12px',
                            borderRadius: '6px'
                          }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {index + 1}. {userData?.name || `Usuario ${userRank.userId.slice(-6)}`}
                            </span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>
                              {userRank.totalPoints} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {quinielasHistory.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '64px'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>📋</div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
                  No hay historial de quinielas aún
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalles de Usuario */}
      {activeTab === 'userDetails' && userDetails && (
        <UserDetailsView 
          userDetails={userDetails} 
          onBack={() => setActiveTab('global')} 
        />
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Componente para mostrar detalles de un usuario
function UserDetailsView({ userDetails, onBack }) {
  if (!userDetails || !userDetails.user) {
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: '0 0 16px 0' }}>
            Error cargando detalles del usuario
          </p>
          <button
            onClick={onBack}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Volver al Ranking
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, quinielaStats, monthlyStats, pointsDistribution } = userDetails;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h3 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              👤 {user.name}
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              margin: 0
            }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={onBack}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ← Volver al Ranking
          </button>
        </div>

        {/* Estadísticas Principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { title: 'Puntos Totales', value: stats.totalPoints, color: '#3b82f6' },
            { title: 'Precisión', value: `${stats.accuracy.toFixed(1)}%`, color: '#10b981' },
            { title: 'Resultados Exactos', value: stats.exactScores, color: '#f59e0b' },
            { title: 'Quinielas Ganadas', value: user.quinielasWon, color: '#8b5cf6' }
          ].map((stat, index) => (
            <div key={index} style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: stat.color,
                margin: '0 0 8px 0'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico de Distribución de Puntos */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📊 Distribución de Puntos por Predicción
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}>
            {Object.entries(pointsDistribution).map(([points, count]) => {
              const total = Object.values(pointsDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              const colors = {
                '0': '#ef4444',
                '1': '#f59e0b',
                '2': '#3b82f6',
                '3': '#f59e0b',
                '5': '#10b981'
              };
              
              return (
                <div key={points} style={{ textAlign: 'center' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      height: '80px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'end',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      background: colors[points],
                      position: 'relative'
                    }}>
                      <div style={{
                        height: `${Math.max(percentage * 0.8, 15)}%`,
                        width: '100%',
                        background: colors[points],
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}>
                        {count}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '4px'
                  }}>
                    {points} pts
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Más secciones... */}
    </div>
  );
}