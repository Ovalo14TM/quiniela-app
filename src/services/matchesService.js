// src/services/matchesService.js
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

// Crear o actualizar partido en Firestore
export const saveMatch = async (matchData) => {
  try {
    const matchRef = doc(db, 'matches', matchData.id);
    await setDoc(matchRef, {
      ...matchData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return matchRef;
  } catch (error) {
    console.error('Error saving match:', error);
    throw error;
  }
};

// Obtener partido por ID
export const getMatch = async (matchId) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (matchSnap.exists()) {
      return { id: matchSnap.id, ...matchSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting match:', error);
    return null;
  }
};

// Obtener partidos por semana
export const getMatchesByWeek = async (weekId) => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('weekId', '==', weekId),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() });
    });
    
    return matches;
  } catch (error) {
    console.error('Error getting matches by week:', error);
    return [];
  }
};

// Obtener todos los partidos disponibles (para admin)
export const getAllAvailableMatches = async () => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, orderBy('date', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() });
    });
    
    return matches;
  } catch (error) {
    console.error('Error getting all matches:', error);
    return [];
  }
};

// Actualizar resultado de partido
export const updateMatchResult = async (matchId, homeScore, awayScore) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      homeScore,
      awayScore,
      status: 'FINISHED',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating match result:', error);
    return false;
  }
};

// Guardar múltiples partidos (para importación desde API)
export const saveMultipleMatches = async (matches) => {
  try {
    const promises = matches.map(match => saveMatch(match));
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error saving multiple matches:', error);
    return false;
  }
};