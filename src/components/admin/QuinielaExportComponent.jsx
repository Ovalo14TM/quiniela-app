import React, { useState, useRef, useEffect } from 'react';
import { Download, Camera, Users, Target, Trophy, RefreshCw } from 'lucide-react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getQuinielasHistory } from '../../services/rankingsService';
import { getAllUsers } from '../../services/userService';

const QuinielaExportComponent = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [selectedQuinielaId, setSelectedQuinielaId] = useState('');
  const [quinielaData, setQuinielaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingQuinielas, setLoadingQuinielas] = useState(true);
  const exportRef = useRef();

  useEffect(() => {
    loadAvailableQuinielas();
  }, []);

  const loadAvailableQuinielas = async () => {
    setLoadingQuinielas(true);
    try {
      const quinielasHistory = await getQuinielasHistory();
      // Incluir quinielas abiertas, cerradas y terminadas que tengan participantes
      const availableQuinielas = quinielasHistory.filter(q => 
        ['open', 'closed', 'finished'].includes(q.status) && q.totalParticipants > 0
      );
      setQuinielas(availableQuinielas);
    } catch (error) {
      console.error('Error loading quinielas:', error);
    }
    setLoadingQuinielas(false);
  };

  const loadQuinielaData = async (quinielaId) => {
    if (!quinielaId) return;
    
    setLoading(true);
    try {
      // 1. Cargar datos básicos de la quiniela
      const quinielaRef = doc(db, 'quinielas', quinielaId);
      const quinielaSnap = await getDoc(quinielaRef);
      
      if (!quinielaSnap.exists()) {
        throw new Error('Quiniela no encontrada');
      }

      const quinielaInfo = quinielaSnap.data();

      // 2. Cargar todos los usuarios del sistema
      const allUsers = await getAllUsers();
      const usersMap = new Map(allUsers.map(user => [user.id, user]));

      // 3. Cargar partidos de la quiniela
      const matchesData = await Promise.all(
        quinielaInfo.matches.map(async (matchId) => {
          const matchRef = doc(db, 'matches', matchId);
          const matchSnap = await getDoc(matchRef);
          
          if (matchSnap.exists()) {
            const matchData = matchSnap.data();
            return {
              id: matchSnap.id,
              ...matchData,
              date: matchData.date?.toDate ? matchData.date.toDate() : new Date(matchData.date)
            };
          }
          return null;
        })
      );

      const validMatches = matchesData
        .filter(match => match !== null)
        .sort((a, b) => a.date - b.date);

      // 4. Cargar todas las predicciones de esta quiniela
      const predictionsRef = collection(db, 'predictions');
      const predictionsQuery = query(
        predictionsRef,
        where('quinielaId', '==', quinielaId)
      );
      const predictionsSnap = await getDocs(predictionsQuery);

      // Organizar predicciones por usuario
      const allPredictions = {};
      const participantsSet = new Set();

      predictionsSnap.forEach((doc) => {
        const predData = doc.data();
        const userId = predData.userId;
        
        participantsSet.add(userId);
        
        if (!allPredictions[userId]) {
          allPredictions[userId] = {};
        }
        
        allPredictions[userId][predData.matchId] = {
          homeScore: predData.homeScore,
          awayScore: predData.awayScore,
          points: predData.points || 0
        };
      });

      // 5. Crear lista de usuarios participantes con sus totales
      const participants = Array.from(participantsSet)
        .map(userId => {
          const user = usersMap.get(userId);
          if (!user) return null;

          const userPredictions = allPredictions[userId] || {};
          const totalPoints = Object.values(userPredictions)
            .reduce((sum, pred) => sum + (pred.points || 0), 0);

          return {
            id: userId,
            name: user.name,
            email: user.email,
            totalPoints
          };
        })
        .filter(user => user !== null)
        .sort((a, b) => b.totalPoints - a.totalPoints); // Ordenar por puntos

      // 6. Estructurar datos finales
      setQuinielaData({
        id: quinielaId,
        title: quinielaInfo.title,
        weekNumber: quinielaInfo.weekNumber,
        deadline: quinielaInfo.deadline?.toDate ? quinielaInfo.deadline.toDate() : new Date(quinielaInfo.deadline),
        status: quinielaInfo.status,
        users: participants,
        matches: validMatches,
        predictions: allPredictions
      });

    } catch (error) {
      console.error('Error loading quiniela data:', error);
      alert('Error al cargar los datos de la quiniela');
    }
    setLoading(false);
  };

  const exportAsImage = async () => {
    if (!quinielaData) return;
    
    setIsExporting(true);
    
    try {
      // Verificar si html2canvas está disponible
      if (!window.html2canvas) {
        // Si no está disponible, cargar desde CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      const element = exportRef.current;
      const canvas = await window.html2canvas(element, {
        backgroundColor: '#1a1a2e',
        scale: 2, // Alta calidad
        useCORS: true,
        allowTaint: true,
        width: element.scrollWidth,
        height: element.scrollHeight
      });
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      const fileName = `${quinielaData.title.replace(/[^a-z0-9\s]/gi, '_')}_${Date.now()}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      alert('✅ Imagen exportada correctamente');
      
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al generar la imagen. Intenta instalar html2canvas: npm install html2canvas');
    }
    
    setIsExporting(false);
  };

  const getPointsColor = (points) => {
    if (points === 5) return '#10b981'; // Verde - Resultado exacto
    if (points === 3) return '#3b82f6'; // Azul - Ganador correcto
    if (points === 1) return '#f59e0b'; // Amarillo - Algo correcto
    return '#ef4444'; // Rojo - Error
  };

  const getPointsIcon = (points) => {
    if (points === 5) return '🎯';
    if (points === 3) return '✅';
    if (points === 1) return '⚡';
    return '❌';
  };

  const formatScore = (homeScore, awayScore) => {
    if (homeScore === undefined || awayScore === undefined || 
        homeScore === null || awayScore === null) return '-';
    return `${homeScore}-${awayScore}`;
  };

  const formatMatchResult = (match) => {
    if (match.homeScore === undefined || match.awayScore === undefined || 
        match.homeScore === null || match.awayScore === null) {
      return 'Pendiente';
    }
    return `${match.homeScore}-${match.awayScore}`;
  };

  const truncateName = (name, maxLength = 10) => {
    if (!name) return 'Usuario';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loadingQuinielas) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <RefreshCw size={48} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '18px' }}>Cargando quinielas...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header y controles */}
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
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Camera size={32} />
                Exportar Quinielas
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontSize: '16px'
              }}>
                Genera imágenes de las quinielas para compartir en WhatsApp
              </p>
            </div>
          </div>

          {/* Selector de quiniela */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <select
              value={selectedQuinielaId}
              onChange={(e) => {
                setSelectedQuinielaId(e.target.value);
                loadQuinielaData(e.target.value);
              }}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                fontSize: '16px',
                fontWeight: '500',
                minWidth: '300px',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              <option value="">Selecciona una quiniela...</option>
              {quinielas.map(quiniela => (
                <option key={quiniela.id} value={quiniela.id}>
                  {quiniela.title} - {
                    quiniela.status === 'finished' ? '🏆 Terminada' :
                    quiniela.status === 'closed' ? '⏰ Cerrada' : '🔓 Abierta'
                  } ({quiniela.totalParticipants} participantes)
                </option>
              ))}
            </select>

            {quinielaData && (
              <button
                onClick={exportAsImage}
                disabled={isExporting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isExporting ? 'rgba(255, 255, 255, 0.3)' : 'rgba(16, 185, 129, 0.9)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Exportar Imagen
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '64px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <RefreshCw size={48} style={{ margin: '0 auto 16px', color: 'white', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'white', fontSize: '18px', margin: 0 }}>
              Cargando datos de la quiniela...
            </p>
          </div>
        ) : quinielaData ? (
          <div
            ref={exportRef}
            style={{
              background: '#1a1a2e',
              borderRadius: '16px',
              padding: '32px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              overflow: 'auto'
            }}
          >
            {/* Header de la quiniela */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              paddingBottom: '24px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 8px 0'
              }}>
                {quinielaData.title}
              </h2>
              
              {/* Estado de la quiniela */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: quinielaData.status === 'finished' 
                  ? 'rgba(34, 197, 94, 0.2)' 
                  : quinielaData.status === 'closed'
                  ? 'rgba(249, 115, 22, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${quinielaData.status === 'finished' 
                  ? 'rgba(34, 197, 94, 0.4)' 
                  : quinielaData.status === 'closed'
                  ? 'rgba(249, 115, 22, 0.4)'
                  : 'rgba(59, 130, 246, 0.4)'}`,
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600',
                color: quinielaData.status === 'finished' 
                  ? '#22c55e' 
                  : quinielaData.status === 'closed'
                  ? '#f97316'
                  : '#3b82f6'
              }}>
                {quinielaData.status === 'finished' && '🏆 Quiniela Terminada - Resultados Finales'}
                {quinielaData.status === 'closed' && '⏰ Predicciones Cerradas - Esperando Resultados'}
                {quinielaData.status === 'open' && '🔓 Quiniela Abierta - En Progreso'}
              </div>

              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '18px',
                margin: '0 0 16px 0'
              }}>
                {quinielaData.users.length} participantes • {quinielaData.matches.length} partidos
              </p>
              
              {quinielaData.status === 'finished' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '32px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Trophy size={24} style={{ color: '#ffd700', marginBottom: '8px' }} />
                    <p style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                      <strong>🥇 Ganador: {quinielaData.users[0]?.name || 'N/A'}</strong>
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
                      {quinielaData.users[0]?.totalPoints || 0} puntos
                    </p>
                  </div>
                </div>
              )}


            </div>

            {/* Tabla de predicciones */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                minWidth: '800px'
              }}>
                {/* Header con nombres de usuarios */}
                <thead>
                  <tr>
                    <th style={{
                      padding: '12px 8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      minWidth: '200px',
                      textAlign: 'left'
                    }}>
                      PARTIDOS
                    </th>
                    {quinielaData.users.map((user, index) => (
                      <th key={user.id} style={{
                        padding: '12px 8px',
                        background: index === 0 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        minWidth: '120px',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {index === 0 && (
                          <Trophy size={16} style={{ 
                            position: 'absolute', 
                            top: '8px', 
                            right: '8px', 
                            color: '#ffd700' 
                          }} />
                        )}
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                          {truncateName(user.name, 12)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {user.totalPoints} pts
                        </div>
                      </th>
                    ))}
                    <th style={{
                      padding: '12px 8px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>
                      RESULTADO
                    </th>
                  </tr>
                </thead>

                {/* Cuerpo de la tabla */}
                <tbody>
                  {quinielaData.matches.map((match) => (
                    <tr key={match.id}>
                      {/* Columna del partido */}
                      <td style={{
                        padding: '16px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontWeight: '500'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {formatDate(match.date)}
                        </div>
                      </td>

                      {/* Predicciones de cada usuario */}
                      {quinielaData.users.map((user) => {
                        const prediction = quinielaData.predictions[user.id]?.[match.id];
                        const points = prediction?.points || 0;
                        
                        return (
                          <td key={user.id} style={{
                            padding: '16px 8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            textAlign: 'center'
                          }}>
                            {prediction ? (
                              <div>
                                <div style={{
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  color: 'white',
                                  marginBottom: '4px'
                                }}>
                                  {formatScore(prediction.homeScore, prediction.awayScore)}
                                </div>
                                {/* Solo mostrar puntos si la quiniela está terminada */}
                                {quinielaData.status === 'finished' && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: getPointsColor(points),
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}>
                                    <span>{getPointsIcon(points)}</span>
                                    <span>{points}pts</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontStyle: 'italic'
                              }}>
                                Sin predicción
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Resultado real */}
                      <td style={{
                        padding: '16px 8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#22c55e'
                        }}>
                          {formatMatchResult(match)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer con leyenda - solo para quinielas terminadas */}
            {quinielaData.status === 'finished' && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{
                  color: 'white',
                  fontSize: '16px',
                  margin: '0 0 12px 0',
                  fontWeight: 'bold'
                }}>
                  Leyenda de Puntuación:
                </h4>
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  fontSize: '14px'
                }}>
                  <span style={{ color: '#10b981' }}>🎯 5pts = Resultado exacto</span>
                  <span style={{ color: '#3b82f6' }}>✅ 3pts = Ganador correcto</span>
                  <span style={{ color: '#f59e0b' }}>⚡ 1pt = Empate/Tendencia</span>
                  <span style={{ color: '#ef4444' }}>❌ 0pts = Predicción incorrecta</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '64px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Camera size={64} style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }} />
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              margin: '0 0 12px 0'
            }}>
              Selecciona una quiniela
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              margin: 0
            }}>
              Elige una quiniela del menú desplegable para generar su imagen
            </p>
          </div>
        )}
      </div>

      {/* CSS para animaciones */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuinielaExportComponent;