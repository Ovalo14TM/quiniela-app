// src/services/scoringService.js - VERSIÓN CORREGIDA
import { 
  doc, 
  getDoc,
  updateDoc, 
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  getPredictionsForMatch, 
  calculatePredictionPoints, 
  updatePredictionPoints 
} from './predictionsService';

// Actualizar resultado de un partido y calcular puntos
export const updateMatchResult = async (matchId, homeScore, awayScore) => {
  try {
    // Asegurarse de que los scores sean números
    const actualHomeScore = parseInt(homeScore);
    const actualAwayScore = parseInt(awayScore);
    
    console.log(`🔄 Actualizando resultado: ${actualHomeScore}-${actualAwayScore} para match ${matchId}`);
    
    // 1. Actualizar el resultado del partido
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      homeScore: actualHomeScore,
      awayScore: actualAwayScore,
      status: 'FINISHED',
      finishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Obtener todas las predicciones para este partido
    const predictions = await getPredictionsForMatch(matchId);
    console.log(`📊 Calculando puntos para ${predictions.length} predicciones...`);

    // 3. Calcular puntos para cada predicción
    const pointsUpdates = [];
    const userPointsMap = new Map();

    for (const prediction of predictions) {
      const points = calculatePredictionPoints(prediction, actualHomeScore, actualAwayScore);
      
      console.log(`👤 Usuario ${prediction.userId}: ${points} puntos`);
      console.log(`   Predicción: ${prediction.homeScore}-${prediction.awayScore}`);
      console.log(`   Resultado: ${actualHomeScore}-${actualAwayScore}`);
      
      // Actualizar puntos de la predicción
      pointsUpdates.push(updatePredictionPoints(prediction.id, points));
      
      // Acumular puntos por usuario
      if (!userPointsMap.has(prediction.userId)) {
        userPointsMap.set(prediction.userId, 0);
      }
      userPointsMap.set(prediction.userId, userPointsMap.get(prediction.userId) + points);
    }

    // 4. Actualizar todas las predicciones
    await Promise.all(pointsUpdates);

    // 5. Actualizar estadísticas de usuarios
    const userStatsUpdates = [];
    for (const [userId, pointsEarned] of userPointsMap) {
      console.log(`📈 Actualizando usuario ${userId} con ${pointsEarned} puntos`);
      userStatsUpdates.push(updateUserPointsStats(userId, pointsEarned));
    }
    await Promise.all(userStatsUpdates);

    console.log(`✅ Resultado actualizado: ${actualHomeScore}-${actualAwayScore}`);
    console.log(`📈 Puntos calculados para ${predictions.length} predicciones`);
    
    return {
      success: true,
      predictionsUpdated: predictions.length,
      usersAffected: userPointsMap.size,
      totalPointsAwarded: Array.from(userPointsMap.values()).reduce((sum, points) => sum + points, 0)
    };

  } catch (error) {
    console.error('Error updating match result:', error);
    throw error;
  }
};

// Actualizar estadísticas de puntos de un usuario - CORREGIDO
const updateUserPointsStats = async (userId, pointsEarned) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Obtener datos actuales del usuario
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    // CORRECCIÓN: Línea que estaba incompleta
    const newTotalPoints = (userData.totalPoints || 0) + pointsEarned;
    
    await updateDoc(userRef, {
      totalPoints: newTotalPoints,
      updatedAt: serverTimestamp()
    });
    
    console.log(`📊 Usuario ${userId}: +${pointsEarned} puntos (total: ${newTotalPoints})`);
  } catch (error) {
    console.error('Error updating user points:', error);
  }
};

// Calcular estadísticas completas de una quiniela
export const calculateQuinielaStats = async (quinielaId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('quinielaId', '==', quinielaId));
    const querySnapshot = await getDocs(q);
    
    const userStats = new Map();
    const matchStats = new Map();
    
    querySnapshot.forEach((doc) => {
      const prediction = doc.data();
      
      // Estadísticas por usuario
      if (!userStats.has(prediction.userId)) {
        userStats.set(prediction.userId, {
          userId: prediction.userId,
          totalPoints: 0,
          predictions: 0,
          correctResults: 0,
          exactScores: 0
        });
      }
      
      const userStat = userStats.get(prediction.userId);
      userStat.totalPoints += prediction.points || 0;
      userStat.predictions += 1;
      
      if (prediction.points === 5) userStat.exactScores += 1;
      if (prediction.points > 0) userStat.correctResults += 1;
      
      // Estadísticas por partido
      if (!matchStats.has(prediction.matchId)) {
        matchStats.set(prediction.matchId, {
          matchId: prediction.matchId,
          totalPredictions: 0,
          averagePoints: 0,
          exactScores: 0
        });
      }
      
      const matchStat = matchStats.get(prediction.matchId);
      matchStat.totalPredictions += 1;
      if (prediction.points === 5) matchStat.exactScores += 1;
    });
    
    // Calcular promedios
    matchStats.forEach((stat) => {
      const totalPoints = Array.from(userStats.values())
        .filter(u => u.predictions > 0)
        .reduce((sum, u) => sum + u.totalPoints, 0);
      stat.averagePoints = stat.totalPredictions > 0 ? 
        totalPoints / stat.totalPredictions : 0;
    });
    
    // Convertir a arrays y ordenar
    const userRanking = Array.from(userStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints);
    
    const matchAnalysis = Array.from(matchStats.values());
    
    return {
      userRanking,
      matchAnalysis,
      totalUsers: userStats.size,
      totalPredictions: querySnapshot.size
    };
    
  } catch (error) {
    console.error('Error calculating quiniela stats:', error);
    return null;
  }
};

// Obtener rankings globales (todas las quinielas)
export const getGlobalRankings = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role !== 'admin') { // Excluir admin del ranking
        users.push({
          id: doc.id,
          name: userData.name,
          email: userData.email,
          totalPoints: userData.totalPoints || 0,
          totalWinnings: userData.totalWinnings || 0,
          quinielasWon: userData.quinielasWon || 0,
          quinielasPlayed: userData.quinielasPlayed || 0
        });
      }
    });
    
    // Ordenar por puntos totales
    return users.sort((a, b) => b.totalPoints - a.totalPoints);
    
  } catch (error) {
    console.error('Error getting global rankings:', error);
    return [];
  }
};

// Determinar ganadores de una quiniela
export const determineQuinielaWinners = async (quinielaId) => {
  try {
    const stats = await calculateQuinielaStats(quinielaId);
    if (!stats || stats.userRanking.length === 0) {
      return { winners: [], payments: [] };
    }
    
    const ranking = stats.userRanking;
    const topScore = ranking[0].totalPoints;
    
    // Encontrar todos los usuarios con el puntaje más alto
    const winners = ranking.filter(user => user.totalPoints === topScore);
    
    // Calcular pagos según las reglas
    const payments = calculatePayments(ranking, winners);
    
    return {
      winners,
      ranking,
      payments,
      quinielaId
    };
    
  } catch (error) {
    console.error('Error determining winners:', error);
    return { winners: [], payments: [] };
  }
};

// Calcular pagos según las reglas del juego
const calculatePayments = (ranking, winners) => {
  const payments = [];
  
  if (ranking.length < 2) return payments; // Necesitamos al menos 2 jugadores
  
  const paymentAmount = 50; // $50 MXN por pago
  
  if (winners.length === 1) {
    // 1 ganador claro: los otros 2 pagan $50 cada uno
    const winner = winners[0];
    const losers = ranking.filter(user => user.userId !== winner.userId);
    
    losers.forEach(loser => {
      payments.push({
        from: loser.userId,
        to: winner.userId,
        amount: paymentAmount,
        reason: 'Quiniela perdida'
      });
    });
    
  } else if (winners.length === 2) {
    // Empate en 1er lugar: el 3ro paga $25 a cada ganador
    const thirdPlace = ranking.find(user => 
      !winners.some(winner => winner.userId === user.userId)
    );
    
    if (thirdPlace) {
      winners.forEach(winner => {
        payments.push({
          from: thirdPlace.userId,
          to: winner.userId,
          amount: paymentAmount / 2,
          reason: 'Tercer lugar'
        });
      });
    }
  }
  // Si winners.length === 3 (triple empate): no hay pagos
  
  return payments;
};

// Verificar si todos los partidos de una quiniela están terminados
export const isQuinielaComplete = async (quinielaId) => {
  try {
    // Obtener la quiniela
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    const quinielaSnap = await getDoc(quinielaRef);
    
    if (!quinielaSnap.exists()) return false;
    
    const quiniela = quinielaSnap.data();
    
    // Verificar cada partido
    const matchPromises = quiniela.matches.map(async (matchId) => {
      const matchRef = doc(db, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      
      if (matchSnap.exists()) {
        const match = matchSnap.data();
        return match.status === 'FINISHED';
      }
      return false;
    });
    
    const matchResults = await Promise.all(matchPromises);
    return matchResults.every(isFinished => isFinished);
    
  } catch (error) {
    console.error('Error checking if quiniela is complete:', error);
    return false;
  }
};

// Función de depuración para verificar puntos
export const debugCalculatePoints = (prediction, actualHomeScore, actualAwayScore) => {
  console.log('🔍 DEBUG - Calculando puntos:');
  console.log('Predicción:', prediction);
  console.log('Resultado real:', actualHomeScore, '-', actualAwayScore);
  
  const points = calculatePredictionPoints(prediction, actualHomeScore, actualAwayScore);
  
  console.log('Puntos obtenidos:', points);
  return points;
};

// Función para recalcular puntos existentes
export const recalculateMatchPoints = async (matchId) => {
  try {
    // Obtener información del partido
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      console.error('Partido no encontrado');
      return;
    }
    
    const match = matchSnap.data();
    
    if (match.homeScore === null || match.awayScore === null) {
      console.log('Partido sin resultado');
      return;
    }
    
    console.log(`🔄 Recalculando puntos para partido: ${match.homeTeam} vs ${match.awayTeam}`);
    console.log(`📊 Resultado: ${match.homeScore}-${match.awayScore}`);
    
    // Obtener predicciones
    const predictions = await getPredictionsForMatch(matchId);
    
    for (const prediction of predictions) {
      const newPoints = calculatePredictionPoints(prediction, match.homeScore, match.awayScore);
      
      console.log(`👤 ${prediction.userId}: ${prediction.homeScore}-${prediction.awayScore} = ${newPoints} puntos`);
      
      // Actualizar en la base de datos
      await updatePredictionPoints(prediction.id, newPoints);
    }
    
    console.log(`✅ ${predictions.length} predicciones recalculadas`);
    
  } catch (error) {
    console.error('Error recalculando puntos:', error);
  }
};