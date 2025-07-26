// src/components/admin/AdminPredictionsViewer.jsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getCurrentQuiniela } from '../../services/quinielaService';
import { getAllUsers } from '../../services/userService';
import { formatMatchDate } from '../../services/footballService';

export default function AdminPredictionsViewer() {
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar quiniela actual
      const quiniela = await getCurrentQuiniela();
      setCurrentQuiniela(quiniela);

      if (quiniela) {
        // Cargar usuarios
        const usersData = await getAllUsers();
        setUsers(usersData.filter(user => user.role === 'user')); // Solo usuarios regulares

        // Cargar partidos de la quiniela
        const matchesData = await Promise.all(
          quiniela.matches.map(async (matchId) => {
            const matchRef = doc(db, 'matches', matchId);
            const matchSnap = await getDoc(matchRef);
            
            if (matchSnap.exists()) {
              return { id: matchSnap.id, ...matchSnap.data() };
            }
            return null;
          })
        );
        
        const validMatches = matchesData
          .filter(match => match != null)
          .sort((a, b) => {
            const dateA = match.date?.toDate ? match.date.toDate() : new Date(match.date);
            const dateB = match.date?.toDate ? match.date.toDate() : new Date(match.date);
            return dateA - dateB;
          });
        setMatches(validMatches);

        // Cargar todas las predicciones
        const predictionsRef = collection(db, 'predictions');
        const q = query(predictionsRef, where('quinielaId', '==', quiniela.id));
        const predictionsSnap = await getDocs(q);
        
        const predictionsData = {};
        predictionsSnap.forEach((doc) => {
          const prediction = doc.data();
          const key = `${prediction.userId}_${prediction.matchId}`;
          predictionsData[key] = prediction;
        });
        
        setAllPredictions(predictionsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const getPrediction = (userId, matchId) => {
    return allPredictions[`${userId}_${matchId}`] || null;
  };

  const getUserCompletionStats = (userId) => {
    const userPredictions = matches.filter(match => 
      getPrediction(userId, match.id) !== null
    );
    return {
      completed: userPredictions.length,
      total: matches.length,
      percentage: Math.round((userPredictions.length / matches.length) * 100)
    };
  };

  const getMatchPredictionsCount = (matchId) => {
    return users.filter(user => getPrediction(user.id, matchId) !== null).length;
  };

  const filteredUsers = selectedUser === 'all' ? users : users.filter(u => u.id === selectedUser);
  const filteredMatches = selectedMatch === 'all' ? matches : matches.filter(m => m.id === selectedMatch);

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
          Cargando predicciones...
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
          Crea una quiniela para ver las predicciones
        </p>
      </div>
    );
  }

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
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          👀 Predicciones de Usuarios - {currentQuiniela.title}
        </h3>

        {/* Filtros */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              👤 Filtrar por Usuario:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#374151'
              }}
            >
              <option value="all">Todos los usuarios</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              ⚽ Filtrar por Partido:
            </label>
            <select
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#374151'
              }}
            >
              <option value="all">Todos los partidos</option>
              {matches.map(match => (
                <option key={match.id} value={match.id}>
                  {match.homeTeam} vs {match.awayTeam}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.4)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {users.length}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              👥 Usuarios Totales
            </div>
          </div>
          
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {matches.length}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              ⚽ Partidos Total
            </div>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {Object.keys(allPredictions).length}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              📝 Predicciones Totales
            </div>
          </div>
        </div>
      </div>

      {/* Vista por Usuario */}
      {selectedUser === 'all' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📊 Resumen por Usuario
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {users.map(user => {
              const stats = getUserCompletionStats(user.id);
              return (
                <div
                  key={user.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {user.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {user.email}
                      </div>
                    </div>
                    
                    <div style={{
                      background: stats.percentage === 100 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : stats.percentage > 0 
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: stats.percentage === 100 
                        ? '#10b981' 
                        : stats.percentage > 0 
                        ? '#f59e0b'
                        : '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: `1px solid ${stats.percentage === 100 
                        ? 'rgba(16, 185, 129, 0.4)' 
                        : stats.percentage > 0 
                        ? 'rgba(245, 158, 11, 0.4)'
                        : 'rgba(239, 68, 68, 0.4)'}`
                    }}>
                      {stats.percentage}%
                    </div>
                  </div>

                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '8px'
                  }}>
                    📝 {stats.completed}/{stats.total} predicciones completadas
                  </div>

                  <button
                    onClick={() => setSelectedUser(user.id)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    👀 Ver Predicciones Detalladas
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Detallada */}
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
          marginBottom: '16px'
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0
          }}>
            📋 Predicciones Detalladas
          </h4>

          {selectedUser !== 'all' && (
            <button
              onClick={() => setSelectedUser('all')}
              style={{
                padding: '8px 16px',
                background: 'rgba(107, 114, 128, 0.3)',
                border: '1px solid rgba(107, 114, 128, 0.5)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ← Volver a Vista General
            </button>
          )}
        </div>

        {/* Tabla de Predicciones */}
        <div style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  📅 Partido
                </th>
                {filteredUsers.map(user => (
                  <th
                    key={user.id}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)',
                      minWidth: '120px'
                    }}
                  >
                    👤 {user.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(match => (
                <tr
                  key={match.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <td style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: 'white'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {formatMatchDate(match.date)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginTop: '4px'
                    }}>
                      📊 {getMatchPredictionsCount(match.id)}/{users.length} predicciones
                    </div>
                  </td>
                  
                  {filteredUsers.map(user => {
                    const prediction = getPrediction(user.id, match.id);
                    return (
                      <td
                        key={`${user.id}_${match.id}`}
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '14px'
                        }}
                      >
                        {prediction ? (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.4)'
                          }}>
                            <div style={{
                              fontWeight: 'bold',
                              color: 'white',
                              fontSize: '16px'
                            }}>
                              {prediction.homeScore} - {prediction.awayScore}
                            </div>
                            {prediction.points !== undefined && (
                              <div style={{
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                marginTop: '2px'
                              }}>
                                🏆 {prediction.points} pts
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '12px'
                          }}>
                            ❌ Sin predicción
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}