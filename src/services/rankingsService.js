// src/services/rankingsService.js
import { 
  collection, 
  doc,
  getDoc,
  getDocs, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// Obtener estadísticas globales de todos los usuarios
export const getGlobalStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const predictionsRef = collection(db, 'predictions');
    const predictionsSnapshot = await getDocs(predictionsRef);
    
    const quinielasRef = collection(db, 'quinielas');
    const quinielasSnapshot = await getDocs(quinielasRef);
    
    // Procesar datos de usuarios
    const users = [];
    const userMap = new Map();
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role !== 'admin') {
        const user = {
          id: doc.id,
          name: userData.name,
          email: userData.email,
          totalPoints: userData.totalPoints || 0,
          totalWinnings: userData.totalWinnings || 0,
          quinielasWon: userData.quinielasWon || 0,
          quinielasPlayed: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          exactScores: 0,
          averagePoints: 0,
          winRate: 0,
          accuracy: 0,
          bestQuiniela: 0,
          worstQuiniela: 999,
          streak: 0,
          lastQuinielaPosition: null
        };
        users.push(user);
        userMap.set(doc.id, user);
      }
    });
    
    // Procesar predicciones para calcular estadísticas
    const userPredictions = new Map();
    predictionsSnapshot.forEach((doc) => {
      const prediction = doc.data();
      const userId = prediction.userId;
      
      if (!userPredictions.has(userId)) {
        userPredictions.set(userId, []);
      }
      userPredictions.get(userId).push(prediction);
    });
    
    // Calcular estadísticas detalladas por usuario
    for (const user of users) {
      const predictions = userPredictions.get(user.id) || [];
      
      user.totalPredictions = predictions.length;
      user.correctPredictions = predictions.filter(p => p.points > 0).length;
      user.exactScores = predictions.filter(p => p.points === 5).length;
      
      if (predictions.length > 0) {
        user.accuracy = (user.correctPredictions / user.totalPredictions) * 100;
        user.averagePoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0) / predictions.length;
        
        // Mejor y peor quiniela (por puntos)
        const quinielaPoints = new Map();
        predictions.forEach(p => {
          if (!quinielaPoints.has(p.quinielaId)) {
            quinielaPoints.set(p.quinielaId, 0);
          }
          quinielaPoints.set(p.quinielaId, quinielaPoints.get(p.quinielaId) + (p.points || 0));
        });
        
        const quinielaScores = Array.from(quinielaPoints.values());
        if (quinielaScores.length > 0) {
          user.bestQuiniela = Math.max(...quinielaScores);
          user.worstQuiniela = Math.min(...quinielaScores);
        }
      }
    }
    
    // Calcular quinielas jugadas
    const quinielaParticipation = new Map();
    quinielasSnapshot.forEach((doc) => {
      const quiniela = doc.data();
      if (quiniela.participants) {
        quiniela.participants.forEach(userId => {
          if (!quinielaParticipation.has(userId)) {
            quinielaParticipation.set(userId, 0);
          }
          quinielaParticipation.set(userId, quinielaParticipation.get(userId) + 1);
        });
      }
    });
    
    // Actualizar quinielas jugadas y win rate
    users.forEach(user => {
      user.quinielasPlayed = quinielaParticipation.get(user.id) || 0;
      if (user.quinielasPlayed > 0) {
        user.winRate = (user.quinielasWon / user.quinielasPlayed) * 100;
      }
    });
    
    // Ordenar por puntos totales
    users.sort((a, b) => b.totalPoints - a.totalPoints);
    
    return users;
    
  } catch (error) {
    console.error('Error getting global stats:', error);
    return [];
  }
};

// Obtener historial de quinielas
export const getQuinielasHistory = async () => {
  try {
    const quinielasRef = collection(db, 'quinielas');
    const q = query(quinielasRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const quinielas = [];
    
    for (const doc of querySnapshot.docs) {
      const quinielaData = doc.data();
      const quinielaId = doc.id;
      
      // Obtener estadísticas de esta quiniela
      const predictionsRef = collection(db, 'predictions');
      const predQuery = query(predictionsRef, where('quinielaId', '==', quinielaId));
      const predSnapshot = await getDocs(predQuery);
      
      const participants = new Map();
      let totalPredictions = 0;
      
      predSnapshot.forEach((predDoc) => {
        const prediction = predDoc.data();
        const userId = prediction.userId;
        
        if (!participants.has(userId)) {
          participants.set(userId, {
            userId,
            totalPoints: 0,
            predictions: 0,
            exactScores: 0
          });
        }
        
        const userStats = participants.get(userId);
        userStats.totalPoints += prediction.points || 0;
        userStats.predictions += 1;
        if (prediction.points === 5) userStats.exactScores += 1;
        
        totalPredictions += 1;
      });
      
      // Convertir a array y ordenar por puntos
      const ranking = Array.from(participants.values())
        .sort((a, b) => b.totalPoints - a.totalPoints);
      
      // Determinar ganadores
      const winners = ranking.length > 0 ? 
        ranking.filter(user => user.totalPoints === ranking[0].totalPoints) : [];
      
      quinielas.push({
        id: quinielaId,
        title: quinielaData.title,
        weekNumber: quinielaData.weekNumber,
        year: quinielaData.year,
        status: quinielaData.status,
        deadline: quinielaData.deadline,
        createdAt: quinielaData.createdAt,
        totalParticipants: participants.size,
        totalPredictions,
        ranking,
        winners: winners.map(w => w.userId),
        topScore: ranking.length > 0 ? ranking[0].totalPoints : 0
      });
    }
    
    return quinielas;
    
  } catch (error) {
    console.error('Error getting quinielas history:', error);
    return [];
  }
};

// Obtener estadísticas detalladas de un usuario específico
export const getUserDetailedStats = async (userId) => {
  try {
    // Obtener datos básicos del usuario
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const userData = userSnap.data();
    
    // Obtener todas las predicciones del usuario
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const predictions = [];
    const quinielaStats = new Map();
    const monthlyStats = new Map();
    
    querySnapshot.forEach((doc) => {
      const prediction = doc.data();
      predictions.push(prediction);
      
      // Estadísticas por quiniela
      if (!quinielaStats.has(prediction.quinielaId)) {
        quinielaStats.set(prediction.quinielaId, {
          quinielaId: prediction.quinielaId,
          totalPoints: 0,
          predictions: 0,
          exactScores: 0,
          correctPredictions: 0
        });
      }
      
      const quinielaStat = quinielaStats.get(prediction.quinielaId);
      quinielaStat.totalPoints += prediction.points || 0;
      quinielaStat.predictions += 1;
      if (prediction.points === 5) quinielaStat.exactScores += 1;
      if (prediction.points > 0) quinielaStat.correctPredictions += 1;
      
      // Estadísticas mensuales
      const createdAt = prediction.createdAt?.toDate ? prediction.createdAt.toDate() : new Date();
      const monthKey = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, {
          month: monthKey,
          totalPoints: 0,
          predictions: 0,
          exactScores: 0
        });
      }
      
      const monthlyStat = monthlyStats.get(monthKey);
      monthlyStat.totalPoints += prediction.points || 0;
      monthlyStat.predictions += 1;
      if (prediction.points === 5) monthlyStat.exactScores += 1;
    });
    
    // Calcular estadísticas generales
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.points > 0).length;
    const exactScores = predictions.filter(p => p.points === 5).length;
    const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
    
    // Mejores y peores quinielas
    const quinielaArray = Array.from(quinielaStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Estadísticas por puntos
    const pointsDistribution = {
      0: predictions.filter(p => p.points === 0).length,
      1: predictions.filter(p => p.points === 1).length,
      2: predictions.filter(p => p.points === 2).length,
      3: predictions.filter(p => p.points === 3).length,
      5: predictions.filter(p => p.points === 5).length
    };
    
    return {
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        totalPoints: userData.totalPoints || 0,
        totalWinnings: userData.totalWinnings || 0,
        quinielasWon: userData.quinielasWon || 0
      },
      stats: {
        totalPredictions,
        correctPredictions,
        exactScores,
        totalPoints,
        accuracy: totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0,
        averagePoints: totalPredictions > 0 ? totalPoints / totalPredictions : 0,
        exactScoreRate: totalPredictions > 0 ? (exactScores / totalPredictions) * 100 : 0
      },
      quinielaStats: quinielaArray,
      monthlyStats: Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month)),
      pointsDistribution,
      bestQuiniela: quinielaArray.length > 0 ? quinielaArray[0] : null,
      worstQuiniela: quinielaArray.length > 0 ? quinielaArray[quinielaArray.length - 1] : null
    };
    
  } catch (error) {
    console.error('Error getting user detailed stats:', error);
    return null;
  }
};

// Obtener comparativa entre usuarios
export const getUserComparison = async (userIds) => {
  try {
    const comparisons = [];
    
    for (const userId of userIds) {
      const userStats = await getUserDetailedStats(userId);
      if (userStats) {
        comparisons.push(userStats);
      }
    }
    
    // Calcular métricas de comparación
    const metrics = {
      totalPoints: comparisons.map(u => ({ userId: u.user.id, value: u.stats.totalPoints }))
        .sort((a, b) => b.value - a.value),
      accuracy: comparisons.map(u => ({ userId: u.user.id, value: u.stats.accuracy }))
        .sort((a, b) => b.value - a.value),
      exactScores: comparisons.map(u => ({ userId: u.user.id, value: u.stats.exactScores }))
        .sort((a, b) => b.value - a.value),
      averagePoints: comparisons.map(u => ({ userId: u.user.id, value: u.stats.averagePoints }))
        .sort((a, b) => b.value - a.value),
      quinielasWon: comparisons.map(u => ({ userId: u.user.id, value: u.user.quinielasWon }))
        .sort((a, b) => b.value - a.value)
    };
    
    return {
      users: comparisons,
      metrics
    };
    
  } catch (error) {
    console.error('Error getting user comparison:', error);
    return null;
  }
};