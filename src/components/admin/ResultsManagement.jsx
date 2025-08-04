// src/components/admin/ResultsManagement.jsx - Versión mejorada con actualización masiva
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
  
  // Estados para actualización masiva
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState(new Map());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState(new Map());

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

  // Función original para actualización individual
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

  // ✅ NUEVAS FUNCIONES PARA ACTUALIZACIÓN MASIVA

  const handleBulkScoreChange = (matchId, type, value) => {
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 99)) {
      const newBulkResults = new Map(bulkResults);
      const current = newBulkResults.get(matchId) || { homeScore: '', awayScore: '' };
      current[type] = value;
      newBulkResults.set(matchId, current);
      setBulkResults(newBulkResults);
      
      // Limpiar errores de validación
      const newErrors = new Map(validationErrors);
      newErrors.delete(matchId);
      setValidationErrors(newErrors);
    }
  };

  const validateBulkResults = () => {
    const errors = new Map();
    const validMatches = new Map();

    bulkResults.forEach((scores, matchId) => {
      const { homeScore, awayScore } = scores;
      
      if (homeScore === '' || awayScore === '') {
        errors.set(matchId, 'Marcador incompleto');
      } else if (parseInt(homeScore) < 0 || parseInt(awayScore) < 0) {
        errors.set(matchId, 'Marcador inválido');
      } else if (isNaN(parseInt(homeScore)) || isNaN(parseInt(awayScore))) {
        errors.set(matchId, 'Debe ser un número');
      } else {
        validMatches.set(matchId, {
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore)
        });
      }
    });

    setValidationErrors(errors);
    return { validMatches, errors };
  };

  const handleBulkUpdate = async () => {
    const { validMatches, errors } = validateBulkResults();

    if (errors.size > 0) {
      alert(`❌ Hay ${errors.size} errores que corregir antes de continuar`);
      return;
    }

    if (validMatches.size === 0) {
      alert('⚠️ No hay resultados para actualizar');
      return;
    }

    // Mostrar confirmación detallada
    const matchesList = Array.from(validMatches.entries()).map(([matchId, scores]) => {
      const match = matches.find(m => m.id === matchId);
      return `• ${match.homeTeam} ${scores.homeScore} - ${scores.awayScore} ${match.awayTeam}`;
    }).join('\n');

    const confirmMessage = `🎯 ACTUALIZACIÓN MASIVA DE RESULTADOS

Se actualizarán ${validMatches.size} partidos:

${matchesList}

⚠️ Esta acción:
• Calculará puntos automáticamente
• Actualizará rankings
• Enviará notificaciones

¿Continuar?`;

    if (!window.confirm(confirmMessage)) return;

    setBulkUpdating(true);
    const results = [];
    let totalPredictions = 0;
    let totalUsers = 0;

    try {
      // Procesar actualizaciones una por una para mantener integridad
      for (const [matchId, scores] of validMatches.entries()) {
        try {
          const result = await updateMatchResult(
            matchId, 
            scores.homeScore, 
            scores.awayScore
          );
          
          const match = matches.find(m => m.id === matchId);
          results.push({
            match: `${match.homeTeam} ${scores.homeScore}-${scores.awayScore} ${match.awayTeam}`,
            success: true,
            ...result
          });
          
          totalPredictions += result.predictionsUpdated;
          totalUsers += result.usersAffected;
          
        } catch (error) {
          const match = matches.find(m => m.id === matchId);
          results.push({
            match: `${match.homeTeam} vs ${match.awayTeam}`,
            success: false,
            error: error.message
          });
        }
      }

      // Mostrar resumen detallado
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      const summaryMessage = `✅ ACTUALIZACIÓN COMPLETADA

📊 Resumen:
• ${successCount} partidos actualizados correctamente
• ${errorCount} errores
• ${totalPredictions} predicciones calculadas
• ${totalUsers} usuarios afectados

${errorCount > 0 ? `\n❌ Errores:\n${results.filter(r => !r.success).map(r => `• ${r.match}: ${r.error}`).join('\n')}` : ''}

✅ Actualizaciones exitosas:
${results.filter(r => r.success).map(r => `• ${r.match}`).join('\n')}`;

      alert(summaryMessage);

      // Limpiar estado y recargar datos
      setBulkResults(new Map());
      setValidationErrors(new Map());
      setBulkMode(false);
      await loadCurrentQuiniela();

    } catch (error) {
      console.error('Error in bulk update:', error);
      alert('❌ Error en la actualización masiva');
    }
    setBulkUpdating(false);
  };

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setBulkResults(new Map());
    setValidationErrors(new Map());
  };

  const cancelBulkMode = () => {
    setBulkMode(false);
    setBulkResults(new Map());
    setValidationErrors(new Map());
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '18px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Cargando quiniela...
        </div>
      </div>
    );
  }

  if (!currentQuiniela) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
            ❌ No hay quiniela activa
          </h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Crea una nueva quiniela en la sección de administración
          </p>
        </div>
      </div>
    );
  }

  const finishedMatches = matches.filter(match => match.status === 'FINISHED').length;
  const progressPercentage = matches.length > 0 ? (finishedMatches / matches.length) * 100 : 0;
  const pendingMatches = matches.filter(match => match.status !== 'FINISHED');

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px 0'
          }}>
            🏆 Gestión de Resultados
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontSize: '16px'
          }}>
            Quiniela: {currentQuiniela.name}
          </p>
        </div>

        {/* Controles de modo masivo */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {!bulkMode ? (
            <>
              <button
                onClick={toggleBulkMode}
                disabled={pendingMatches.length === 0}
                style={{
                  background: pendingMatches.length > 0 ? 
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                    'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: pendingMatches.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                🚀 Modo Masivo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBulkUpdate}
                disabled={bulkResults.size === 0 || bulkUpdating}
                style={{
                  background: bulkResults.size > 0 && !bulkUpdating ? 
                    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                    'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: bulkResults.size > 0 && !bulkUpdating ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {bulkUpdating ? (
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
                    ⚡ Actualizar {bulkResults.size} Resultados
                  </>
                )}
              </button>
              
              <button
                onClick={cancelBulkMode}
                disabled={bulkUpdating}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: bulkUpdating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ❌ Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Información de modo masivo */}
      {bulkMode && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>🚀</span>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
              Modo Actualización Masiva Activado
            </span>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontSize: '14px'
          }}>
            Ingresa los marcadores para múltiples partidos y actualízalos todos a la vez.
            {bulkResults.size > 0 && (
              <span style={{ color: '#10b981', marginLeft: '8px' }}>
                ({bulkResults.size} partidos con marcadores ingresados)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Barra de progreso */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px'
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
            bulkMode={bulkMode}
            bulkScore={bulkResults.get(match.id) || { homeScore: '', awayScore: '' }}
            onBulkScoreChange={handleBulkScoreChange}
            validationError={validationErrors.get(match.id)}
          />
        ))}
      </div>

      {/* Estadísticas y Rankings */}
      {quinielaStats && quinielaStats.userRanking.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '24px'
        }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📊 Ranking Actual
          </h4>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Posición
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Usuario
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Puntos
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Aciertos
                  </th>
                </tr>
              </thead>
              <tbody>
                {quinielaStats.userRanking.map((user, index) => (
                  <tr key={user.userId} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <td style={{
                      padding: '16px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white',
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

// Componente para cada partido - Actualizado para soportar modo masivo
function MatchResultCard({ 
  match, 
  index, 
  onUpdateResult, 
  updating,
  bulkMode = false,
  bulkScore = { homeScore: '', awayScore: '' },
  onBulkScoreChange,
  validationError
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '');

  const isFinished = match.status === 'FINISHED';
  const canEdit = !isFinished || bulkMode;

  const handleSubmit = () => {
    if (!bulkMode) {
      onUpdateResult(match.id, homeScore, awayScore);
    }
  };

  const handleBulkChange = (type, value) => {
    if (onBulkScoreChange) {
      onBulkScoreChange(match.id, type, value);
    }
  };

  const displayHomeScore = bulkMode ? bulkScore.homeScore : homeScore;
  const displayAwayScore = bulkMode ? bulkScore.awayScore : awayScore;

  return (
    <div style={{
      background: isFinished ? 
        'rgba(16, 185, 129, 0.1)' : 
        'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '20px',
      border: validationError ? 
        '2px solid rgba(239, 68, 68, 0.6)' : 
        `1px solid ${isFinished ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      {/* Indicador de estado */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isFinished && (
          <span style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            ✅ Finalizado
          </span>
        )}
        
        {validationError && (
          <span style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(239, 68, 68, 0.4)'
          }}>
            ❌ {validationError}
          </span>
        )}

        <span style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px'
        }}>
          #{index + 1}
        </span>
      </div>

      {/* Información del partido */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flex: 1
        }}>
          <div style={{
            textAlign: 'center',
            flex: 1
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '8px'
            }}>
              {match.homeTeam}
            </div>
            <input
              type="number"
              min="0"
              max="99"
              value={displayHomeScore}
              onChange={(e) => bulkMode ? 
                handleBulkChange('homeScore', e.target.value) : 
                setHomeScore(e.target.value)
              }
              disabled={!canEdit || updating}
              style={{
                width: '60px',
                height: '48px',
                fontSize: '20px',
                fontWeight: 'bold',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                if (canEdit) {
                  e.target.style.border = '2px solid #3b82f6';
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0 16px'
          }}>
            VS
          </div>

          <div style={{
            textAlign: 'center',
            flex: 1
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '8px'
            }}>
              {match.awayTeam}
            </div>
            <input
              type="number"
              min="0"
              max="99"
              value={displayAwayScore}
              onChange={(e) => bulkMode ? 
                handleBulkChange('awayScore', e.target.value) : 
                setAwayScore(e.target.value)
              }
              disabled={!canEdit || updating}
              style={{
                width: '60px',
                height: '48px',
                fontSize: '20px',
                fontWeight: 'bold',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                if (canEdit) {
                  e.target.style.border = '2px solid #3b82f6';
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>
        </div>

        {/* Botón de actualización individual (solo en modo normal) */}
        {!bulkMode && !isFinished && (
          <button
            onClick={handleSubmit}
            disabled={updating || homeScore === '' || awayScore === ''}
            style={{
              background: updating ? 'rgba(255, 255, 255, 0.2)' : 
                        (homeScore !== '' && awayScore !== '') ? 
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                        'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: updating || homeScore === '' || awayScore === '' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '140px',
              justifyContent: 'center',
              marginLeft: '20px',
              transition: 'all 0.2s ease'
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
                💾 Actualizar
              </>
            )}
          </button>
        )}
      </div>

      {/* Información adicional */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <span>
          {match.league}
        </span>
        {match.date && (
          <span>
            {formatMatchDate ? formatMatchDate(match.date) : 'Fecha no disponible'}
          </span>
        )}
      </div>
    </div>
  );
}