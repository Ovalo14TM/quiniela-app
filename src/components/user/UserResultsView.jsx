// NUEVO COMPONENTE: src/components/user/UserResultsView.jsx

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getCurrentQuiniela } from '../../services/quinielaService';
import { getUserPredictionsForQuiniela } from '../../services/predictionsService';
import { getQuinielaRanking } from '../../services/predictionsService';
import { getAllUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { formatMatchDate } from '../../services/footballService';

export default function UserResultsView() {
  const { currentUser } = useAuth();
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [matches, setMatches] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [ranking, setRanking] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadResultsData();
  }, [currentUser]);

  const loadResultsData = async () => {
    setLoading(true);
    try {
      // Cargar quiniela actual
      const quiniela = await getCurrentQuiniela();
      if (quiniela) {
        setCurrentQuiniela(quiniela);

        // Cargar partidos con resultados
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

        const validMatches = quinielaMatches
          .filter(match => match != null)
          .map(match => ({
            ...match,
            date: match.date?.toDate ? match.date.toDate() : new Date(match.date)
          }))
          .sort((a, b) => a.date - b.date);

        setMatches(validMatches);

        // Cargar predicciones del usuario
        const predictions = await getUserPredictionsForQuiniela(currentUser.uid, quiniela.id);
        setUserPredictions(predictions);

        // Calcular puntos totales del usuario
        const userTotalPoints = Object.values(predictions).reduce((sum, pred) => sum + (pred.points || 0), 0);
        setTotalPoints(userTotalPoints);

        // Cargar ranking
        const quinielaRanking = await getQuinielaRanking(quiniela.id);
        
        // Cargar datos de usuarios para el ranking
        const allUsers = await getAllUsers();
        const usersMap = new Map(allUsers.map(user => [user.id, user]));

        const enrichedRanking = quinielaRanking.map((rankData, index) => ({
          ...rankData,
          position: index + 1,
          user: usersMap.get(rankData.userId) || { name: 'Usuario desconocido' }
        }));

        setRanking(enrichedRanking);
        setUsers(allUsers);

        // Encontrar posición del usuario actual
        const userRank = enrichedRanking.find(rank => rank.userId === currentUser.uid);
        setCurrentUserRank(userRank);
      }
    } catch (error) {
      console.error('Error loading results data:', error);
    }
    setLoading(false);
  };

  const getPointsColor = (points) => {
    if (points === 5) return '#10b981'; // Verde - Resultado exacto
    if (points === 3) return '#3b82f6'; // Azul - Ganador + goles
    if (points === 2) return '#8b5cf6'; // Púrpura - Empate acertado  
    if (points === 1) return '#f59e0b'; // Amarillo - Solo ganador
    return '#6b7280'; // Gris - Sin puntos
  };

  const getPointsDescription = (points) => {
    if (points === 5) return 'Resultado exacto';
    if (points === 3) return 'Ganador + goles';
    if (points === 2) return 'Empate acertado';
    if (points === 1) return 'Solo ganador';
    return 'Sin puntos';
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
          Cargando resultados...
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
          No hay resultados para mostrar
        </p>
      </div>
    );
  }

  const finishedMatches = matches.filter(match => match.status === 'FINISHED');
  const pendingMatches = matches.filter(match => match.status !== 'FINISHED');

  return (
    <div style={{ color: 'white' }}>
      {/* Header con resumen */}
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
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          📊 Resultados - {currentQuiniela.title}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {/* Mi posición */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.2)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              #{currentUserRank?.position || '-'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              🏆 Mi Posición
            </div>
          </div>

          {/* Mis puntos */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {totalPoints}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              ⭐ Mis Puntos
            </div>
          </div>

          {/* Partidos terminados */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.2)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {finishedMatches.length}/{matches.length}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              ✅ Terminados
            </div>
          </div>

          {/* Promedio de puntos */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.2)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {finishedMatches.length > 0 ? (totalPoints / finishedMatches.length).toFixed(1) : '0.0'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              📈 Promedio
            </div>
          </div>
        </div>
      </div>

      {/* Ranking actual */}
      {ranking.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏅 Ranking Actual
          </h3>

          <div style={{
            display: 'grid',
            gap: '8px'
          }}>
            {ranking.slice(0, 5).map((rankData, index) => (
              <div
                key={rankData.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: rankData.userId === currentUser.uid 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: rankData.userId === currentUser.uid 
                    ? '1px solid rgba(59, 130, 246, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7c2f' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : rankData.position}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {rankData.user.name}
                      {rankData.userId === currentUser.uid && (
                        <span style={{ color: '#3b82f6', fontSize: '12px', marginLeft: '8px' }}>
                          (Tú)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      {rankData.predictions} predicciones
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  {rankData.totalPoints} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partidos con resultados */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚽ Mis Predicciones vs Resultados
        </h3>

        {/* Partidos terminados */}
        {finishedMatches.map((match, index) => {
          const prediction = userPredictions[match.id];
          const points = prediction?.points || 0;
          
          return (
            <div key={match.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                gap: '16px'
              }}>
                {/* Info del partido */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.4)'
                    }}>
                      ✅ TERMINADO
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {match.league}
                    </span>
                  </div>
                  
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 4px 0'
                  }}>
                    {match.homeTeam} vs {match.awayTeam}
                  </h4>
                  
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0
                  }}>
                    📅 {formatMatchDate(match.date)}
                  </p>
                </div>

                {/* Resultado vs Predicción */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  {/* Resultado real */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>
                      RESULTADO REAL
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {match.homeScore} - {match.awayScore}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '20px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    VS
                  </div>

                  {/* Mi predicción */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>
                      MI PREDICCIÓN
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: prediction ? '#3b82f6' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {prediction ? `${prediction.homeScore} - ${prediction.awayScore}` : 'Sin predicción'}
                    </div>
                  </div>

                  {/* Puntos obtenidos */}
                  <div style={{
                    background: `rgba(${getPointsColor(points).replace('#', '')}, 0.2)`,
                    border: `1px solid ${getPointsColor(points)}`,
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: getPointsColor(points)
                    }}>
                      {points}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: getPointsColor(points),
                      opacity: 0.8
                    }}>
                      {getPointsDescription(points)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Partidos pendientes */}
        {pendingMatches.map((match) => {
          const prediction = userPredictions[match.id];
          
          return (
            <div key={match.id} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              opacity: 0.7
            }}>
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                gap: '16px'
              }}>
                {/* Info del partido */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: 'rgba(107, 114, 128, 0.2)',
                      color: '#9ca3af',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(107, 114, 128, 0.4)'
                    }}>
                      ⏳ PENDIENTE
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {match.league}
                    </span>
                  </div>
                  
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '0 0 4px 0'
                  }}>
                    {match.homeTeam} vs {match.awayTeam}
                  </h4>
                  
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0
                  }}>
                    📅 {formatMatchDate(match.date)}
                  </p>
                </div>

                {/* Mi predicción para partidos pendientes */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>
                      MI PREDICCIÓN
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: prediction ? 'rgba(59, 130, 246, 0.8)' : 'rgba(107, 114, 128, 0.8)'
                    }}>
                      {prediction ? `${prediction.homeScore} - ${prediction.awayScore}` : 'Sin predicción'}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(107, 114, 128, 0.2)',
                    border: '1px solid rgba(107, 114, 128, 0.4)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#9ca3af'
                    }}>
                      ?
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      opacity: 0.8
                    }}>
                      Esperando resultado
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
