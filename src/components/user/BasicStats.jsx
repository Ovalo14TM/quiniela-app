// src/components/user/BasicStats.jsx - Estadísticas básicas y ranking
import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/userService';
import { getAllQuinielas } from '../../services/quinielaService';
import { getGlobalRankings } from '../../services/scoringService';
import { useAuth } from '../../context/AuthContext';

export default function BasicStats() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [quinielas, setQuinielas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ranking');
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const [usersData, rankingsData, quinielasData] = await Promise.all([
        getAllUsers(),
        getGlobalRankings(),
        getAllQuinielas()
      ]);

      setUsers(usersData);
      setRankings(rankingsData);
      setQuinielas(quinielasData.slice(0, 5)); // Solo las últimas 5

      // Encontrar posición del usuario actual
      const position = rankingsData.findIndex(user => user.id === currentUser.uid);
      setUserPosition(position >= 0 ? position + 1 : null);

    } catch (error) {
      console.error('Error loading stats data:', error);
    }
    setLoading(false);
  };

  const TabButton = ({ tabId, label, isActive, onClick, icon }) => (
    <button
      onClick={() => onClick(tabId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span>{label}</span>
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
          Cargando estadísticas...
        </p>
      </div>
    );
  }

  const currentUserData = rankings.find(user => user.id === currentUser.uid);

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
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          📊 Estadísticas
        </h2>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <TabButton
            tabId="ranking"
            label="Ranking Global"
            icon="🏆"
            isActive={activeTab === 'ranking'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="history"
            label="Historial"
            icon="📋"
            isActive={activeTab === 'history'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="personal"
            label="Mi Rendimiento"
            icon="👤"
            isActive={activeTab === 'personal'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Mi Posición Actual */}
      {currentUserData && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 12px 0'
          }}>
            📈 Tu Posición Actual
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: userPosition <= 3 ? '#fbbf24' : '#3b82f6',
                margin: '0 0 4px 0'
              }}>
                #{userPosition || '?'}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Posición
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#10b981',
                margin: '0 0 4px 0'
              }}>
                {currentUserData.totalPoints}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Puntos
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: currentUserData.totalWinnings >= 0 ? '#10b981' : '#ef4444',
                margin: '0 0 4px 0'
              }}>
                ${currentUserData.totalWinnings}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Balance
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#8b5cf6',
                margin: '0 0 4px 0'
              }}>
                {currentUserData.quinielasWon}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Ganadas
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking Global */}
      {activeTab === 'ranking' && (
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
            🏆 Ranking Global
          </h3>
          
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
                  }}>Pos</th>
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
                  }}>Balance</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>Ganadas</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((user, index) => {
                  const isCurrentUser = user.id === currentUser.uid;
                  return (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      background: isCurrentUser ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                    >
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
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
                          {index < 3 && (
                            <span style={{ fontSize: '20px' }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'white',
                        fontWeight: isCurrentUser ? 'bold' : 'normal'
                      }}>
                        {user.name || `Usuario ${user.id.slice(-6)}`}
                        {isCurrentUser && (
                          <span style={{
                            marginLeft: '8px',
                            background: 'rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            TÚ
                          </span>
                        )}
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
                        fontWeight: '600',
                        color: user.totalWinnings >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        ${user.totalWinnings >= 0 ? '+' : ''}{user.totalWinnings}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        {user.quinielasWon}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            📋 Últimas Quinielas
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {quinielas.map((quiniela) => (
              <div key={quiniela.id} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
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
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0
                  }}>
                    {quiniela.title}
                  </h4>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    background: quiniela.status === 'finished'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : quiniela.status === 'open'
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)',
                    color: quiniela.status === 'finished' ? '#10b981' :
                           quiniela.status === 'open' ? '#3b82f6' : '#f59e0b',
                    border: `1px solid ${quiniela.status === 'finished' ? 'rgba(16, 185, 129, 0.4)' :
                                         quiniela.status === 'open' ? 'rgba(59, 130, 246, 0.4)' :
                                         'rgba(245, 158, 11, 0.4)'}`
                  }}>
                    {quiniela.status === 'finished' ? '✅ Terminada' :
                     quiniela.status === 'open' ? '🟢 Abierta' : '⏳ En Progreso'}
                  </span>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '12px',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  <div>
                    <strong>{quiniela.matches?.length || 0}</strong> partidos
                  </div>
                  <div>
                    <strong>{quiniela.stats?.totalParticipants || 0}</strong> participantes
                  </div>
                  <div>
                    <strong>{Math.round(quiniela.stats?.completionRate || 0)}%</strong> completado
                  </div>
                  {quiniela.createdAt && (
                    <div>
                      {new Date(quiniela.createdAt.toDate()).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mi Rendimiento */}
      {activeTab === 'personal' && currentUserData && (
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
            👤 Mi Rendimiento Detallado
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#3b82f6',
                margin: '0 0 8px 0'
              }}>
                {currentUserData.totalPoints}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Puntos Totales
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Posición #{userPosition}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: currentUserData.totalWinnings >= 0 ? '#10b981' : '#ef4444',
                margin: '0 0 8px 0'
              }}>
                ${currentUserData.totalWinnings}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Balance Total
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {currentUserData.totalWinnings >= 0 ? 'En positivo' : 'En negativo'}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#8b5cf6',
                margin: '0 0 8px 0'
              }}>
                {currentUserData.quinielasWon}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Quinielas Ganadas
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {currentUserData.quinielasPlayed > 0 
                  ? `${Math.round((currentUserData.quinielasWon / currentUserData.quinielasPlayed) * 100)}% efectividad`
                  : 'Sin partidos'
                }
              </div>
            </div>
          </div>
        </div>
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
      `}</style>
    </div>
  );
}