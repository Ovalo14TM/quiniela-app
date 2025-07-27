// src/services/predictionsService.js - VERSIÓN CORREGIDA
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Crear o actualizar predicción
export const savePrediction = async (predictionData) => {
  try {
    const predictionId = `${predictionData.userId}_${predictionData.matchId}`;
    const predictionRef = doc(db, 'predictions', predictionId);
    
    const prediction = {
      id: predictionId,
      userId: predictionData.userId,
      matchId: predictionData.matchId,
      quinielaId: predictionData.quinielaId,
      homeScore: parseInt(predictionData.homeScore),
      awayScore: parseInt(predictionData.awayScore),
      points: 0, // Se calculará después del partido
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(predictionRef, prediction, { merge: true });
    return predictionRef;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
};

// Obtener predicción específica
export const getPrediction = async (userId, matchId) => {
  try {
    const predictionId = `${userId}_${matchId}`;
    const predictionRef = doc(db, 'predictions', predictionId);
    const predictionSnap = await getDoc(predictionRef);
    
    if (predictionSnap.exists()) {
      return { id: predictionSnap.id, ...predictionSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting prediction:', error);
    return null;
  }
};

// Obtener todas las predicciones de un usuario para una quiniela
export const getUserPredictionsForQuiniela = async (userId, quinielaId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(
      predictionsRef,
      where('userId', '==', userId),
      where('quinielaId', '==', quinielaId)
    );
    
    const querySnapshot = await getDocs(q);
    const predictions = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      predictions[data.matchId] = data;
    });
    
    return predictions;
  } catch (error) {
    console.error('Error getting user predictions:', error);
    return {};
  }
};

// Obtener todas las predicciones para un partido específico
export const getPredictionsForMatch = async (matchId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(
      predictionsRef,
      where('matchId', '==', matchId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const predictions = [];
    
    querySnapshot.forEach((doc) => {
      predictions.push({ id: doc.id, ...doc.data() });
    });
    
    return predictions;
  } catch (error) {
    console.error('Error getting match predictions:', error);
    return [];
  }
};

// Calcular puntos de una predicción - FUNCIÓN CORREGIDA
export const calculatePredictionPoints = (prediction, actualHomeScore, actualAwayScore) => {
  // CORRECCIÓN: Convertir todo a números para comparaciones correctas
  const predHomeScore = parseInt(prediction.homeScore);
  const predAwayScore = parseInt(prediction.awayScore);
  const actualHome = parseInt(actualHomeScore);
  const actualAway = parseInt(actualAwayScore);
  
  // Validar que todos los valores sean números válidos
  if (isNaN(predHomeScore) || isNaN(predAwayScore) || isNaN(actualHome) || isNaN(actualAway)) {
    console.log('⚠️ Valores inválidos para calcular puntos:', {
      prediction: `${predHomeScore}-${predAwayScore}`,
      actual: `${actualHome}-${actualAway}`
    });
    return 0;
  }
  
  // Resultado exacto: 5 puntos
  if (predHomeScore === actualHome && predAwayScore === actualAway) {
    console.log(`🎯 Resultado exacto! ${predHomeScore}-${predAwayScore}`);
    return 5;
  }
  
  // Determinar ganador real y predicho
  let actualResult, predResult;
  
  if (actualHome > actualAway) {
    actualResult = 'home';
  } else if (actualHome < actualAway) {
    actualResult = 'away';
  } else {
    actualResult = 'draw';
  }
  
  if (predHomeScore > predAwayScore) {
    predResult = 'home';
  } else if (predHomeScore < predAwayScore) {
    predResult = 'away';
  } else {
    predResult = 'draw';
  }
  
  // Solo acertó ganador
  if (actualResult === predResult) {
    // Empate acertado: 2 puntos
    if (actualResult === 'draw') {
      console.log(`🤝 Empate acertado! ${predHomeScore}-${predAwayScore}`);
      return 2;
    }
    
    // Acertar ganador + goles de un equipo: 3 puntos
    if (predHomeScore === actualHome || predAwayScore === actualAway) {
      console.log(`⚽ Ganador + 1 resultado exacto! ${predHomeScore}-${predAwayScore}`);
      return 3;
    }
    
    // Solo ganador: 1 punto
    console.log(`👍 Solo ganador acertado! ${predHomeScore}-${predAwayScore}`);
    return 1;
  }
  
  // No acertó nada: 0 puntos
  console.log(`❌ No acertó nada: ${predHomeScore}-${predAwayScore} vs ${actualHome}-${actualAway}`);
  return 0;
};

// Actualizar puntos de una predicción
export const updatePredictionPoints = async (predictionId, points) => {
  try {
    const predictionRef = doc(db, 'predictions', predictionId);
    await updateDoc(predictionRef, {
      points,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating prediction points:', error);
    return false;
  }
};

// Calcular puntos para todas las predicciones de un partido
export const calculatePointsForMatch = async (matchId, homeScore, awayScore) => {
  try {
    const predictions = await getPredictionsForMatch(matchId);
    const updates = [];
    
    for (const prediction of predictions) {
      const points = calculatePredictionPoints(prediction, homeScore, awayScore);
      updates.push(updatePredictionPoints(prediction.id, points));
    }
    
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error calculating match points:', error);
    return false;
  }
};

// Obtener ranking de usuarios para una quiniela
export const getQuinielaRanking = async (quinielaId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(
      predictionsRef,
      where('quinielaId', '==', quinielaId)
    );
    
    const querySnapshot = await getDocs(q);
    const userPoints = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!userPoints[data.userId]) {
        userPoints[data.userId] = {
          userId: data.userId,
          totalPoints: 0,
          predictions: 0
        };
      }
      
      userPoints[data.userId].totalPoints += data.points || 0;
      userPoints[data.userId].predictions += 1;
    });
    
    // Convertir a array y ordenar
    const ranking = Object.values(userPoints).sort((a, b) => b.totalPoints - a.totalPoints);
    
    return ranking;
  } catch (error) {
    console.error('Error getting quiniela ranking:', error);
    return [];
  }
};

// Verificar si usuario ya hizo todas las predicciones
export const hasUserCompletedPredictions = async (userId, quinielaId, totalMatches) => {
  try {
    const predictions = await getUserPredictionsForQuiniela(userId, quinielaId);
    return Object.keys(predictions).length === totalMatches;
  } catch (error) {
    console.error('Error checking completed predictions:', error);
    return false;
  }
};

// Actualizar puntos totales de un usuario para una quiniela específica
export const updateUserPredictionPoints = async (userId, quinielaId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(
      predictionsRef,
      where('userId', '==', userId),
      where('quinielaId', '==', quinielaId)
    );
    
    const querySnapshot = await getDocs(q);
    let totalPoints = 0;
    
    querySnapshot.forEach((doc) => {
      const prediction = doc.data();
      totalPoints += prediction.points || 0;
    });
    
    // Actualizar puntos totales del usuario
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Obtener puntos de otras quinielas
      const allPredictionsRef = collection(db, 'predictions');
      const allUserPredictionsQ = query(
        allPredictionsRef,
        where('userId', '==', userId)
      );
      
      const allUserPredictions = await getDocs(allUserPredictionsQ);
      let grandTotalPoints = 0;
      
      allUserPredictions.forEach((doc) => {
        const prediction = doc.data();
        grandTotalPoints += prediction.points || 0;
      });
      
      await updateDoc(userRef, {
        totalPoints: grandTotalPoints,
        updatedAt: serverTimestamp()
      });
      
      console.log(`📊 Usuario ${userId}: puntos totales actualizados a ${grandTotalPoints}`);
    }
    
    return totalPoints;
  } catch (error) {
    console.error('Error updating user prediction points:', error);
    return 0;
  }
};

// Función para depurar predicciones
export const debugPredictionCalculation = (prediction, actualHomeScore, actualAwayScore) => {
  console.log('🔍 DEBUG PREDICCIÓN:');
  console.log('- Predicción raw:', prediction);
  console.log('- homeScore (tipo):', typeof prediction.homeScore, prediction.homeScore);
  console.log('- awayScore (tipo):', typeof prediction.awayScore, prediction.awayScore);
  console.log('- Resultado real:', actualHomeScore, '-', actualAwayScore);
  console.log('- Tipo resultado:', typeof actualHomeScore, typeof actualAwayScore);
  
  const points = calculatePredictionPoints(prediction, actualHomeScore, actualAwayScore);
  console.log('- Puntos calculados:', points);
  
  return points;
};