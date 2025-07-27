// src/services/scoringService.js - VERSIÓN COMPLETA CORREGIDA
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

// ✅ FUNCIÓN CORREGIDA: Actualizar resultado de un partido y calcular puntos
export const updateMatchResult = async (matchId, homeScore, awayScore) => {
  try {
    // 🔧 CORRECCIÓN: Convertir a números desde el principio
    const finalHomeScore = parseInt(homeScore);
    const finalAwayScore = parseInt(awayScore);
    
    // Verificar que los valores sean válidos
    if (isNaN(finalHomeScore) || isNaN(finalAwayScore) || finalHomeScore < 0 || finalAwayScore < 0) {
      throw new Error('Marcadores inválidos');
    }
    
    console.log(`🎯 Actualizando resultado: ${finalHomeScore}-${finalAwayScore}`);
    
    // 1. Actualizar el resultado del partido
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      homeScore: finalHomeScore,
      awayScore: finalAwayScore,
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
      // 🔧 CORRECCIÓN: Pasar los números convertidos
      const points = calculatePredictionPoints(prediction, finalHomeScore, finalAwayScore);
      
      // Actualizar puntos de la predicción
      pointsUpdates.push(updatePredictionPoints(prediction.id, points));
      
      // Acumular puntos por usuario
      if (!userPointsMap.has(prediction.userId)) {
        userPointsMap.set(prediction.userId, 0);
      }
      userPointsMap.set(prediction.userId, userPointsMap.get(prediction.userId) + points);
      
      console.log(`👤 Usuario ${prediction.userId}: ${points} puntos (${prediction.homeScore}-${prediction.awayScore} vs ${finalHomeScore}-${finalAwayScore})`);
    }

    // 4. Actualizar todas las predicciones
    await Promise.all(pointsUpdates);

    // 5. Actualizar estadísticas de usuarios
    const userStatsUpdates = [];
    for (const [userId, pointsEarned] of userPointsMap) {
      userStatsUpdates.push(updateUserPointsStats(userId, pointsEarned));
    }
    await Promise.all(userStatsUpdates);

    console.log(`✅ Resultado actualizado: ${finalHomeScore}-${finalAwayScore}`);
    console.log(`📈 Puntos calculados para ${predictions.length} predicciones`);
    
    return {
      success: true,
      predictionsUpdated: predictions.length,
      usersAffected: userPointsMap.size,
      message: `Resultado ${finalHomeScore}-${finalAwayScore} actualizado correctamente`
    };

  } catch (error) {
    console.error('Error updating match result:', error);
    throw error;
  }
};

// Actualizar estadísticas de puntos de un usuario
const updateUserPointsStats = async (userId, pointsEarned) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Obtener datos actuales del usuario
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    const newTotalPoints = (userData.totalPoints || 0) + pointsEarned;
    
    await updateDoc(userRef, {
      totalPoints: newTotalPoints,
      updatedAt: serverTimestamp()
    });
    
    console.log(`📊 Usuario ${userId}: +${pointsEarned} puntos (Total: ${newTotalPoints})`);
    
  } catch (error) {
    console.error('Error updating user points stats:', error);
  }
};

// Calcular estadísticas de una quiniela específica
export const calculateQuinielaStats = async (quinielaId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('quinielaId', '==', quinielaId));
    const querySnapshot = await getDocs(q);

    const userStats = new Map();
    const matchStats = new Map();

    querySnapshot.forEach((doc) => {
      const prediction = doc.data();
      const userId = prediction.userId;
      const matchId = prediction.matchId;

      // Estadísticas por usuario
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userId,
          totalPoints: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          exactScores: 0
        });
      }

      const userStat = userStats.get(userId);
      userStat.totalPoints += prediction.points || 0;
      userStat.totalPredictions += 1;
      
      if (prediction.points > 0) {
        userStat.correctPredictions += 1;
      }
      if (prediction.points === 5) {
        userStat.exactScores += 1;
      }

      // Estadísticas por partido
      if (!matchStats.has(matchId)) {
        matchStats.set(matchId, {
          matchId,
          totalPredictions: 0,
          totalPoints: 0,
          perfectPredictions: 0
        });
      }

      const matchStat = matchStats.get(matchId);
      matchStat.totalPredictions += 1;
      matchStat.totalPoints += prediction.points || 0;
      if (prediction.points === 5) {
        matchStat.perfectPredictions += 1;
      }
    });

    // Calcular promedios
    userStats.forEach((stat) => {
      stat.averagePoints = stat.totalPredictions > 0 ? 
        stat.totalPoints / stat.totalPredictions : 0;
    });

    matchStats.forEach((stat) => {
      stat.averagePoints = stat.totalPredictions > 0 ? 
        stat.totalPoints / stat.totalPredictions : 0;
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
    // 2 ganadores empatados: el 3ro paga $25 a cada uno
    const winner1 = winners[0];
    const winner2 = winners[1];
    const loser = ranking.find(user => 
      user.userId !== winner1.userId && user.userId !== winner2.userId
    );
    
    if (loser) {
      payments.push({
        from: loser.userId,
        to: winner1.userId,
        amount: paymentAmount / 2,
        reason: 'Quiniela perdida (empate)'
      });
      payments.push({
        from: loser.userId,
        to: winner2.userId,
        amount: paymentAmount / 2,
        reason: 'Quiniela perdida (empate)'
      });
    }
  }
  // Si hay 3 ganadores empatados, nadie paga nada
  
  return payments;
};

// ✅ FUNCIÓN NUEVA: Recalcular puntos para un partido (utilidad para debugging)
export const recalculateMatchPoints = async (matchId) => {
  try {
    // Obtener información del partido
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      throw new Error('Partido no encontrado');
    }
    
    const matchData = matchSnap.data();
    
    if (matchData.homeScore === undefined || matchData.awayScore === undefined) {
      throw new Error('El partido no tiene resultado definido');
    }
    
    // Recalcular usando la función principal
    return await updateMatchResult(matchId, matchData.homeScore, matchData.awayScore);
    
  } catch (error) {
    console.error('Error recalculating match points:', error);
    throw error;
  }
};

// ✅ FUNCIÓN NUEVA: Debugging - Verificar puntos de un partido específico
export const debugMatchPoints = async (matchId) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      return { error: 'Partido no encontrado' };
    }
    
    const matchData = matchSnap.data();
    const predictions = await getPredictionsForMatch(matchId);
    
    const debugInfo = {
      match: {
        id: matchId,
        homeScore: matchData.homeScore,
        awayScore: matchData.awayScore,
        status: matchData.status
      },
      predictions: predictions.map(pred => ({
        userId: pred.userId,
        prediction: `${pred.homeScore}-${pred.awayScore}`,
        points: pred.points,
        calculatedPoints: calculatePredictionPoints(pred, matchData.homeScore, matchData.awayScore)
      }))
    };
    
    console.log('🔍 Debug info for match:', debugInfo);
    return debugInfo;
    
  } catch (error) {
    console.error('Error debugging match points:', error);
    return { error: error.message };
  }
};