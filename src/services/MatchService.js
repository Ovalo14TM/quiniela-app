// src/services/matchService.js - Funciones auxiliares adicionales

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculatePredictionPoints, updateUserPredictionPoints } from './predictionsService';

// Obtener partidos por array de IDs
export const getMatchesByIds = async (matchIds) => {
  try {
    if (!matchIds || matchIds.length === 0) {
      return [];
    }

    const matches = [];
    
    // Obtener cada partido individualmente
    for (const matchId of matchIds) {
      try {
        const matchRef = doc(db, 'matches', matchId);
        const matchSnap = await getDoc(matchRef);
        
        if (matchSnap.exists()) {
          matches.push({
            id: matchSnap.id,
            ...matchSnap.data()
          });
        }
      } catch (error) {
        console.error(`Error getting match ${matchId}:`, error);
      }
    }

    return matches;
    
  } catch (error) {
    console.error('Error getting matches by IDs:', error);
    return [];
  }
};

// Obtener todos los partidos de una liga específica
export const getMatchesByLeague = async (league) => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('league', '==', league));
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      matches.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return matches;
    
  } catch (error) {
    console.error('Error getting matches by league:', error);
    return [];
  }
};

// Actualizar resultado de partido y recalcular puntos
export const updateMatchResult = async (matchId, homeScore, awayScore) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    
    // 1. Actualizar el partido
    await updateDoc(matchRef, {
      homeScore: parseInt(homeScore),
      awayScore: parseInt(awayScore),
      status: 'FINISHED',
      updatedAt: serverTimestamp(),
      resultUpdatedAt: serverTimestamp()
    });

    // 2. Obtener todas las predicciones para este partido
    const predictionsRef = collection(db, 'predictions');
    const predictionsQuery = query(
      predictionsRef, 
      where('matchId', '==', matchId)
    );
    const predictionsSnapshot = await getDocs(predictionsQuery);

    let predictionsUpdated = 0;
    let usersAffected = new Set();

    // 3. Recalcular puntos para cada predicción
    for (const predictionDoc of predictionsSnapshot.docs) {
      try {
        const prediction = predictionDoc.data();
        
        // Calcular nuevos puntos
        const points = calculatePredictionPoints(
          prediction, 
          parseInt(homeScore), 
          parseInt(awayScore)
        );

        // Actualizar predicción con nuevos puntos
        const predictionRef = doc(db, 'predictions', predictionDoc.id);
        await updateDoc(predictionRef, {
          points,
          calculatedAt: serverTimestamp()
        });

        predictionsUpdated++;
        usersAffected.add(prediction.userId);

        // 4. Actualizar puntos totales del usuario
        await updateUserPredictionPoints(prediction.userId, prediction.quinielaId);
        
      } catch (error) {
        console.error(`Error updating prediction ${predictionDoc.id}:`, error);
      }
    }

    console.log(`✅ Match result updated: ${predictionsUpdated} predictions, ${usersAffected.size} users affected`);

    return {
      success: true,
      predictionsUpdated,
      usersAffected: usersAffected.size,
      message: 'Resultado actualizado y puntos recalculados'
    };

  } catch (error) {
    console.error('Error updating match result:', error);
    throw error;
  }
};

// Obtener partidos pendientes de resultado
export const getPendingMatches = async () => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef, 
      where('status', 'in', ['SCHEDULED', 'IN_PLAY', 'PAUSED'])
    );
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Incluir solo partidos sin resultado final
      if (data.homeScore === undefined || data.awayScore === undefined) {
        matches.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return matches;
    
  } catch (error) {
    console.error('Error getting pending matches:', error);
    return [];
  }
};

// Obtener partidos finalizados
export const getFinishedMatches = async () => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('status', '==', 'FINISHED'));
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      matches.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return matches;
    
  } catch (error) {
    console.error('Error getting finished matches:', error);
    return [];
  }
};

// Revertir resultado de partido (para correcciones)
export const revertMatchResult = async (matchId) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    
    // 1. Limpiar resultado del partido
    await updateDoc(matchRef, {
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      updatedAt: serverTimestamp(),
      resultRevertedAt: serverTimestamp()
    });

    // 2. Resetear puntos de predicciones relacionadas
    const predictionsRef = collection(db, 'predictions');
    const predictionsQuery = query(
      predictionsRef, 
      where('matchId', '==', matchId)
    );
    const predictionsSnapshot = await getDocs(predictionsQuery);

    let predictionsReverted = 0;
    let usersAffected = new Set();

    for (const predictionDoc of predictionsSnapshot.docs) {
      try {
        const prediction = predictionDoc.data();
        
        // Resetear puntos a 0
        const predictionRef = doc(db, 'predictions', predictionDoc.id);
        await updateDoc(predictionRef, {
          points: 0,
          calculatedAt: null,
          revertedAt: serverTimestamp()
        });

        predictionsReverted++;
        usersAffected.add(prediction.userId);

        // Actualizar puntos totales del usuario
        await updateUserPredictionPoints(prediction.userId, prediction.quinielaId);
        
      } catch (error) {
        console.error(`Error reverting prediction ${predictionDoc.id}:`, error);
      }
    }

    console.log(`🔄 Match result reverted: ${predictionsReverted} predictions reset`);

    return {
      success: true,
      predictionsReverted,
      usersAffected: usersAffected.size,
      message: 'Resultado revertido y puntos reseteados'
    };

  } catch (error) {
    console.error('Error reverting match result:', error);
    throw error;
  }
};

// Obtener estadísticas de un partido
export const getMatchStats = async (matchId) => {
  try {
    // Obtener información del partido
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      return null;
    }

    const matchData = matchSnap.data();

    // Obtener predicciones para este partido
    const predictionsRef = collection(db, 'predictions');
    const predictionsQuery = query(
      predictionsRef, 
      where('matchId', '==', matchId)
    );
    const predictionsSnapshot = await getDocs(predictionsQuery);

    const predictions = [];
    let totalPoints = 0;
    let perfectPredictions = 0;

    predictionsSnapshot.forEach((doc) => {
      const prediction = doc.data();
      predictions.push(prediction);
      
      if (prediction.points) {
        totalPoints += prediction.points;
        if (prediction.points === 5) {
          perfectPredictions++;
        }
      }
    });

    return {
      match: { id: matchSnap.id, ...matchData },
      totalPredictions: predictions.length,
      averagePoints: predictions.length > 0 ? totalPoints / predictions.length : 0,
      perfectPredictions,
      totalPoints,
      predictions
    };

  } catch (error) {
    console.error('Error getting match stats:', error);
    return null;
  }
};

// Función para generar resultados de prueba aleatorios
export const generateRandomResultsForMatches = async (matchIds) => {
  try {
    const results = [];
    
    for (const matchId of matchIds) {
      const homeScore = Math.floor(Math.random() * 4); // 0-3 goles
      const awayScore = Math.floor(Math.random() * 4);   // 0-3 goles
      
      try {
        const result = await updateMatchResult(matchId, homeScore, awayScore);
        results.push({
          matchId,
          homeScore,
          awayScore,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          matchId,
          success: false,
          error: error.message
        });
      }
      
      // Pausa pequeña para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
    
  } catch (error) {
    console.error('Error generating random results:', error);
    throw error;
  }
};