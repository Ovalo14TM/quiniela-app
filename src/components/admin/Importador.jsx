// ImportadorPrediccionesSimples.jsx - Para sistema simple de ganador/empate
import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getAllUsers } from '../../services/userService';

export default function ImportadorPrediccionesSimples() {
  const [systemUsers, setSystemUsers] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ✅ DATOS COMPLETOS PRE-CONFIGURADOS
  const matches = [
    { homeTeam: 'Puebla', awayTeam: 'Santos', homeScore: 1, awayScore: 0, winner: 'Puebla' },
    { homeTeam: 'Querétaro', awayTeam: 'Pumas UNAM', homeScore: 0, awayScore: 2, winner: 'Pumas UNAM' },
    { homeTeam: 'Tijuana', awayTeam: 'FC Juarez', homeScore: 1, awayScore: 1, winner: 'Empate' },
    { homeTeam: 'Pachuca', awayTeam: 'Mazatlán FC', homeScore: 1, awayScore: 0, winner: 'Pachuca' },
    { homeTeam: 'Guadalajara', awayTeam: 'Atlético de San Luis', homeScore: 4, awayScore: 3, winner: 'Guadalajara' },
    { homeTeam: 'Cruz Azul', awayTeam: 'León', homeScore: 4, awayScore: 1, winner: 'Cruz Azul' },
    { homeTeam: 'Monterrey', awayTeam: 'Atlas', homeScore: 3, awayScore: 1, winner: 'Monterrey' },
    { homeTeam: 'Toluca', awayTeam: 'Tigres UANL', homeScore: 3, awayScore: 4, winner: 'Tigres UANL' },
    { homeTeam: 'Necaxa', awayTeam: 'América', homeScore: 1, awayScore: 1, winner: 'Empate' }
  ];

  // ✅ PREDICCIONES REALES DE LOS USUARIOS (CORREGIDAS)
  const userPredictionsData = {
    'fer': ['Santos', 'Pumas', 'Tijuana', 'Pachuca', 'Chivas', 'Cruz Azul', 'Monterrey', 'Toluca', 'América'],
    'alberto': ['Santos', 'Pumas', 'FC Juarez', 'Empate', 'Chivas', 'Empate', 'Monterrey', 'Toluca', 'América'],
    'osvaldo': ['Santos', 'Pumas', 'Empate', 'Pachuca', 'Chivas', 'Cruz Azul', 'Monterrey', 'Toluca', 'Necaxa']
  };

  // Mapeo de nombres de usuario del sistema
  const userNameMapping = {
    'osuna@gmail.com': 'fer',
    'ferguerrero2235@gmail.com': 'alberto', 
    'alberto.020100@gmail.com': 'osvaldo'
  };

  useEffect(() => {
    loadSystemUsers();
  }, []);

  const loadSystemUsers = async () => {
    try {
      const users = await getAllUsers();
      const regularUsers = users.filter(user => user.role !== 'admin');
      setSystemUsers(regularUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Normalizar nombres de equipos para comparación
  const normalizeTeamName = (name) => {
    const normalizations = {
      'Santos': 'Santos',
      'Pumas': 'Pumas UNAM', 
      'Pumas UNAM': 'Pumas UNAM',
      'Xolos': 'Tijuana',
      'Tijuana': 'Tijuana',
      'Juárez': 'FC Juarez',
      'FC Juarez': 'FC Juarez',
      'Pachuca': 'Pachuca',
      'Chivas': 'Guadalajara',
      'Guadalajara': 'Guadalajara',
      'Cruz Azul': 'Cruz Azul',
      'Azul': 'Cruz Azul',
      'Monterrey': 'Monterrey',
      'Toluca': 'Toluca',
      'Tigres': 'Tigres UANL',
      'Tigres UANL': 'Tigres UANL',
      'America': 'América',
      'América': 'América',
      'Necaxa': 'Necaxa',
      'Empate': 'Empate',
      'Puebla': 'Puebla'
    };
    
    return normalizations[name] || name;
  };

  // Calcular puntos por predicción
  const calculatePoints = (prediction, actualWinner) => {
    const normalizedPrediction = normalizeTeamName(prediction);
    const normalizedActual = normalizeTeamName(actualWinner);
    
    return normalizedPrediction === normalizedActual ? 1 : 0;
  };

  // Convertir predicción simple a marcador (para compatibilidad)
  const predictionToScore = (prediction, match) => {
    const normalized = normalizeTeamName(prediction);
    
    if (normalized === 'Empate') {
      return { homeScore: 1, awayScore: 1 };
    } else if (normalized === match.homeTeam) {
      return { homeScore: 2, awayScore: 1 };
    } else if (normalized === match.awayTeam) {
      return { homeScore: 1, awayScore: 2 };
    } else {
      // Si no coincide exactamente, asumir local
      return { homeScore: 2, awayScore: 1 };
    }
  };

  const getUserPredictions = (userEmail) => {
    const userName = userNameMapping[userEmail];
    return userPredictionsData[userName] || [];
  };

  const importQuiniela = async () => {
    setImporting(true);
    try {
      const quinielaInfo = {
        id: 'liga_mx_j2_2025_apertura_simple',
        title: 'Liga MX Jornada 2 - 2025 Apertura (Histórica)',
        season: '2025 Apertura',
        jornada: 2,
        league: 'Liga MX',
        isHistorical: true,
        scoringSystem: 'simple_winner', // Nuevo tipo
        status: 'finished',
        deadline: new Date('2025-07-25T19:00:00'),
        description: 'Quiniela manual original - Solo predecir ganador'
      };

      // 1. Crear quiniela histórica
      const quinielaRef = doc(db, 'historical_quinielas', quinielaInfo.id);
      await setDoc(quinielaRef, {
        ...quinielaInfo,
        createdAt: serverTimestamp(),
        importedAt: serverTimestamp()
      });

      // 2. Crear partidos históricos
      const matchIds = [];
      for (let i = 0; i < matches.length; i++) {
        const matchId = `${quinielaInfo.id}_match_${i + 1}`;
        matchIds.push(matchId);
        
        const matchRef = doc(db, 'historical_matches', matchId);
        await setDoc(matchRef, {
          id: matchId,
          quinielaId: quinielaInfo.id,
          homeTeam: matches[i].homeTeam,
          awayTeam: matches[i].awayTeam,
          homeScore: matches[i].homeScore,
          awayScore: matches[i].awayScore,
          winner: matches[i].winner,
          date: new Date(`2025-07-${i < 3 ? '25' : '26'}`),
          league: 'Liga MX',
          status: 'FINISHED',
          jornada: 2,
          season: '2025 Apertura',
          isHistorical: true,
          createdAt: serverTimestamp()
        });
      }

      // 3. Crear predicciones históricas
      let totalPoints = {};
      let totalPredictions = 0;
      const detailedResults = {};
      
      for (const user of systemUsers) {
        totalPoints[user.id] = 0;
        detailedResults[user.id] = [];
        
        const userPredictions = getUserPredictions(user.email);
        
        for (let i = 0; i < matches.length; i++) {
          if (i < userPredictions.length) {
            const prediction = userPredictions[i];
            const points = calculatePoints(prediction, matches[i].winner);
            const scores = predictionToScore(prediction, matches[i]);
            
            totalPoints[user.id] += points;
            
            detailedResults[user.id].push({
              match: `${matches[i].homeTeam} vs ${matches[i].awayTeam}`,
              prediction: prediction,
              actual: matches[i].winner,
              points: points,
              correct: points > 0
            });
            
            const predictionId = `${user.id}_${quinielaInfo.id}_match_${i + 1}`;
            const predictionRef = doc(db, 'historical_predictions', predictionId);
            
            await setDoc(predictionRef, {
              id: predictionId,
              userId: user.id,
              matchId: `${quinielaInfo.id}_match_${i + 1}`,
              quinielaId: quinielaInfo.id,
              // Para compatibilidad con el sistema actual
              homeScore: scores.homeScore,
              awayScore: scores.awayScore,
              // Datos del sistema simple
              predictedWinner: prediction,
              actualWinner: matches[i].winner,
              scoringType: 'simple_winner',
              points: points,
              actualHomeScore: matches[i].homeScore,
              actualAwayScore: matches[i].awayScore,
              isHistorical: true,
              createdAt: new Date('2025-07-25'),
              calculatedAt: serverTimestamp()
            });
            
            totalPredictions++;
          }
        }
      }

      // 4. Actualizar estadísticas de usuarios
      for (const user of systemUsers) {
        const userRef = doc(db, 'users', user.id);
        const currentUser = await getDoc(userRef);
        const userData = currentUser.data();
        
        await updateDoc(userRef, {
          totalPoints: (userData.totalPoints || 0) + totalPoints[user.id],
          quinielasPlayed: (userData.quinielasPlayed || 0) + 1,
          historicalQuinielas: [...(userData.historicalQuinielas || []), quinielaInfo.id],
          updatedAt: serverTimestamp()
        });
      }

      // 5. Crear ranking y determinar ganador
      const ranking = systemUsers.map(user => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        points: totalPoints[user.id],
        predictions: detailedResults[user.id]
      })).sort((a, b) => b.points - a.points);

      const topScore = ranking[0].points;
      const winners = ranking.filter(user => user.points === topScore);

      // 6. Crear pagos históricos
      if (winners.length === 1 && systemUsers.length >= 2) {
        const winner = winners[0];
        const losers = ranking.filter(user => user.userId !== winner.userId);
        
        for (const loser of losers) {
          const paymentId = `historical_${quinielaInfo.id}_${loser.userId}_to_${winner.userId}`;
          const paymentRef = doc(db, 'historical_payments', paymentId);
          
          await setDoc(paymentRef, {
            id: paymentId,
            quinielaId: quinielaInfo.id,
            fromUser: loser.userId,
            toUser: winner.userId,
            amount: 50,
            status: 'paid',
            reason: `Jornada 2 Liga MX 2025 Apertura - ${winner.points} vs ${loser.points} puntos`,
            scoringSystem: 'simple_winner',
            isHistorical: true,
            createdAt: new Date('2025-07-27'),
            paidAt: new Date('2025-07-27')
          });
        }
      }

      setImportResult({
        success: true,
        quinielaId: quinielaInfo.id,
        totalPredictions,
        ranking,
        winners: winners.map(w => w.name),
        detailedResults,
        message: 'Quiniela histórica simple importada exitosamente'
      });

    } catch (error) {
      console.error('Error importing simple quiniela:', error);
      setImportResult({
        success: false,
        error: error.message
      });
    }
    setImporting(false);
  };

  if (importResult) {
    return (
      <div style={{
        background: importResult.success 
          ? 'rgba(16, 185, 129, 0.2)' 
          : 'rgba(239, 68, 68, 0.2)',
        border: `1px solid ${importResult.success 
          ? 'rgba(16, 185, 129, 0.4)' 
          : 'rgba(239, 68, 68, 0.4)'}`,
        borderRadius: '16px',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{
          fontSize: '48px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          {importResult.success ? '🎉' : '❌'}
        </div>
        
        <h3 style={{
          fontSize: '20px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {importResult.success ? '¡Importación Exitosa!' : 'Error en Importación'}
        </h3>
        
        {importResult.success && (
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ marginBottom: '12px' }}>🏆 Resultados Finales:</h4>
              {importResult.ranking.map((user, index) => (
                <div key={user.userId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: index === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '4px',
                  borderRadius: '4px'
                }}>
                  <span>
                    {index === 0 && '👑'} {index + 1}. {user.name}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>
                    {user.points} puntos
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'grid',
              gap: '12px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <p>✅ {importResult.totalPredictions} predicciones importadas</p>
              <p>🏆 Ganador(es): {importResult.winners.join(', ')}</p>
              <p>💰 Pagos históricos calculados automáticamente</p>
            </div>
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 8px 0'
        }}>
          📚 Importar Quiniela Manual Original
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0,
          fontSize: '14px'
        }}>
          Liga MX Jornada 2 - 2025 Apertura • Sistema Simple (Ganador/Empate)
        </p>
      </div>

      {/* Tabla de Vista Previa */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <h4 style={{
          fontSize: '18px',
          marginBottom: '16px'
        }}>
          📋 Vista Previa de Predicciones
        </h4>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: 'white',
                fontWeight: 'bold'
              }}>
                Partido
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                Resultado Real
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'center',
                color: '#93c5fd',
                fontWeight: 'bold'
              }}>
                Fer
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'center',
                color: '#a78bfa',
                fontWeight: 'bold'
              }}>
                Alberto
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'center',
                color: '#fbbf24',
                fontWeight: 'bold'
              }}>
                Osvaldo
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => {
              const ferPrediction = userPredictionsData.fer[index];
              const albertoPrediction = userPredictionsData.alberto[index];
              const osvaldoPrediction = userPredictionsData.osvaldo[index];
              
              return (
                <tr key={index} style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <td style={{
                    padding: '8px 12px',
                    color: 'white'
                  }}>
                    <strong>{match.homeTeam}</strong> vs <strong>{match.awayTeam}</strong>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginTop: '2px'
                    }}>
                      ({match.homeScore}-{match.awayScore})
                    </div>
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981'
                  }}>
                    {match.winner}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    background: calculatePoints(ferPrediction, match.winner) > 0 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(239, 68, 68, 0.2)',
                    color: calculatePoints(ferPrediction, match.winner) > 0 
                      ? '#10b981' 
                      : '#f87171'
                  }}>
                    {ferPrediction} {calculatePoints(ferPrediction, match.winner) > 0 ? '' : ''}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    background: calculatePoints(albertoPrediction, match.winner) > 0 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(239, 68, 68, 0.2)',
                    color: calculatePoints(albertoPrediction, match.winner) > 0 
                      ? '#10b981' 
                      : '#f87171'
                  }}>
                    {albertoPrediction} {calculatePoints(albertoPrediction, match.winner) > 0 ? '' : ''}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    background: calculatePoints(osvaldoPrediction, match.winner) > 0 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(239, 68, 68, 0.2)',
                    color: calculatePoints(osvaldoPrediction, match.winner) > 0 
                      ? '#10b981' 
                      : '#f87171'
                  }}>
                    {osvaldoPrediction} {calculatePoints(osvaldoPrediction, match.winner) > 0 ? '' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderTop: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <td style={{
                padding: '12px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                TOTAL PUNTOS
              </td>
              <td style={{
                padding: '12px',
                textAlign: 'center'
              }}>
                -
              </td>
              <td style={{
                padding: '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#93c5fd'
              }}>
                {userPredictionsData.fer.reduce((total, pred, i) => 
                  total + calculatePoints(pred, matches[i].winner), 0
                )}
              </td>
              <td style={{
                padding: '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#a78bfa'
              }}>
                {userPredictionsData.alberto.reduce((total, pred, i) => 
                  total + calculatePoints(pred, matches[i].winner), 0
                )}
              </td>
              <td style={{
                padding: '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#fbbf24'
              }}>
                {userPredictionsData.osvaldo.reduce((total, pred, i) => 
                  total + calculatePoints(pred, matches[i].winner), 0
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Botón de importar */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={importQuiniela}
          disabled={importing || systemUsers.length === 0}
          style={{
            padding: '16px 32px',
            background: !importing && systemUsers.length > 0
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(107, 114, 128, 0.5)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: !importing && systemUsers.length > 0 ? 'pointer' : 'not-allowed',
            minWidth: '200px'
          }}
        >
          {importing ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></span>
              Importando...
            </>
          ) : (
            '📚 Importar Quiniela Original'
          )}
        </button>
        
        <p style={{
          marginTop: '12px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          ✅ Esto calculará automáticamente ganadores y pagos históricos
        </p>
      </div>
    </div>
  );
}