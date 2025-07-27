// src/components/admin/AdminPredictionsViewer.jsx - VERSIÓN CORREGIDA
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

export default function AdminPredictionsViewer() {
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState('all');
  const [debugInfo, setDebugInfo] = useState({}); // Para debugging

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    console.log('🔄 Cargando datos del admin...');
    
    try {
      // 1. Cargar quiniela actual
      const quiniela = await getCurrentQuiniela();
      console.log('📊 Quiniela cargada:', quiniela);
      setCurrentQuiniela(quiniela);

      if (!quiniela) {
        console.warn('❌ No hay quiniela actual');
        setLoading(false);
        return;
      }

      // 2. Cargar usuarios (excluir admins)
      const allUsersData = await getAllUsers();
      const regularUsers = allUsersData.filter(user => user.role !== 'admin');
      console.log('👥 Usuarios cargados:', regularUsers.length);
      setUsers(regularUsers);

      // 3. Cargar partidos de la quiniela
      console.log('🏈 Cargando partidos:', quiniela.matches);
      const matchesPromises = quiniela.matches.map(async (matchId) => {
        try {
          const matchRef = doc(db, 'matches', matchId);
          const matchSnap = await getDoc(matchRef);
          
          if (matchSnap.exists()) {
            const matchData = matchSnap.data();
            return { 
              id: matchSnap.id, 
              ...matchData,
              // ✅ CORRECCIÓN: Normalizar fecha
              date: matchData.date?.toDate ? matchData.date.toDate() : new Date(matchData.date)
            };
          } else {
            console.warn(`⚠️ Partido ${matchId} no encontrado`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Error cargando partido ${matchId}:`, error);
          return null;
        }
      });
      
      const matchesResults = await Promise.all(matchesPromises);
      const validMatches = matchesResults
        .filter(match => match !== null)
        .sort((a, b) => a.date - b.date);
      
      console.log('⚽ Partidos válidos cargados:', validMatches.length);
      setMatches(validMatches);

      // 4. Cargar todas las predicciones
      console.log('📝 Cargando predicciones...');
      const predictionsRef = collection(db, 'predictions');
      const q = query(predictionsRef, where('quinielaId', '==', quiniela.id));
      const predictionsSnap = await getDocs(q);
      
      const predictionsData = {};
      let totalPredictions = 0;
      
      predictionsSnap.forEach((doc) => {
        const prediction = doc.data();
        const key = `${prediction.userId}_${prediction.matchId}`;
        predictionsData[key] = prediction;
        totalPredictions++;
      });
      
      console.log('📊 Predicciones cargadas:', totalPredictions);
      setAllPredictions(predictionsData);

      // 5. Generar información de debug
      const debugData = {
        quinielaId: quiniela.id,
        totalUsers: regularUsers.length,
        totalMatches: validMatches.length,
        totalPredictions: totalPredictions,
        expectedPredictions: regularUsers.length * validMatches.length,
        completionRate: validMatches.length > 0 ? 
          ((totalPredictions / (regularUsers.length * validMatches.length)) * 100).toFixed(1) : 0
      };
      
      console.log('🔍 Debug Info:', debugData);
      setDebugInfo(debugData);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
    setLoading(false);
  };

  // ✅ FUNCIÓN CORREGIDA: Calcular estadísticas de usuario
  const getUserCompletionStats = (userId) => {
    try {
      if (!matches.length) {
        return { completed: 0, total: 0, percentage: 0 };
      }

      const userPredictions = matches.filter(match => 
        getPrediction(userId, match.id) !== null
      );
      
      const completed = userPredictions.length;
      const total = matches.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return { completed, total, percentage };
    } catch (error) {
      console.error('Error calculando stats de usuario:', error);
      return { completed: 0, total: 0, percentage: 0 };
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Obtener predicción
  const getPrediction = (userId, matchId) => {
    const key = `${userId}_${matchId}`;
    return allPredictions[key] || null;
  };

  // ✅ FUNCIÓN CORREGIDA: Contar predicciones por partido
  const getMatchPredictionsCount = (matchId) => {
    try {
      return users.filter(user => getPrediction(user.id, matchId) !== null).length;
    } catch (error) {
      console.error('Error contando predicciones del partido:', error);
      return 0;
    }
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
      {/* Header con Debug Info */}
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
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              👤 Filtrar:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <option value="all">Todos los usuarios</option>
              {users.map(user => (
                <option key={user.id} value={user.id} style={{ color: 'black' }}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              ⚽ Filtrar por Partido:
            </label>
            <select
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <option value="all">Todos los partidos</option>
              {matches.map(match => (
                <option key={match.id} value={match.id} style={{ color: 'black' }}>
                  {match.homeTeam} vs {match.awayTeam}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ ESTADÍSTICAS CORREGIDAS */}
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
              {debugInfo.totalUsers || 0}
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
              {debugInfo.totalMatches || 0}
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
              {debugInfo.totalPredictions || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              📝 Predicciones Totales
            </div>
          </div>

          <div style={{
            background: 'rgba(168, 85, 247, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(168, 85, 247, 0.4)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {debugInfo.completionRate || 0}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              📊 Completitud General
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
            📊 Resumen
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
                        {user.name || user.email.split('@')[0]}
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
                  >
                    👀 Ver Predicciones Detalladas
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla de Predicciones Detalladas */}
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

        {/* Tabla */}
        <div style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'rgba(255, 255, 255, 0.05)',
            fontSize: '14px'
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
                  color: 'rgba(255, 255, 255, 0.9)',
                  minWidth: '200px'
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
                    {user.name || user.email.split('@')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((match, index) => (
                <tr
                  key={match.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}
                >
                  <td style={{
                    padding: '12px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '4px'
                    }}>
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {match.league} • {match.date.toLocaleDateString('es-MX')}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '2px'
                    }}>
                      {getMatchPredictionsCount(match.id)}/{users.length} predicciones
                    </div>
                  </td>
                  {filteredUsers.map(user => {
                    const prediction = getPrediction(user.id, match.id);
                    return (
                      <td
                        key={user.id}
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {prediction ? (
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '6px',
                            padding: '6px',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>
                            {prediction.homeScore} - {prediction.awayScore}
                            {prediction.points !== undefined && (
                              <div style={{
                                fontSize: '10px',
                                marginTop: '2px',
                                color: prediction.points > 0 ? 'white' : 'white'
                              }}>
                                {prediction.points} pts
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '12px'
                          }}>
                            Sin predicción
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

        {filteredMatches.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            No hay partidos que mostrar
          </div>
        )}
      </div>
    </div>
  );
}