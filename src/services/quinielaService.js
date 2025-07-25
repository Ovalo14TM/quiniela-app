// src/services/quinielaService.js
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

// Crear nueva quiniela semanal
export const createWeeklyQuiniela = async (quinielaData) => {
  try {
    const quinielaId = `week_${quinielaData.year}_${quinielaData.weekNumber}`;
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    
    const quinielaDoc = {
      id: quinielaId,
      weekNumber: quinielaData.weekNumber,
      year: quinielaData.year,
      title: quinielaData.title || `Semana ${quinielaData.weekNumber} - ${quinielaData.year}`,
      matches: quinielaData.matches || [], // Array de IDs de partidos
      status: 'open', // 'open', 'closed', 'finished'
      deadline: quinielaData.deadline,
      createdBy: quinielaData.createdBy,
      createdAt: serverTimestamp(),
      participants: [],
      totalPredictions: 0,
      isActive: true
    };
    
    await setDoc(quinielaRef, quinielaDoc);
    return quinielaRef;
  } catch (error) {
    console.error('Error creating quiniela:', error);
    throw error;
  }
};

// Obtener quiniela por ID
export const getQuiniela = async (quinielaId) => {
  try {
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    const quinielaSnap = await getDoc(quinielaRef);
    
    if (quinielaSnap.exists()) {
      return { id: quinielaSnap.id, ...quinielaSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting quiniela:', error);
    return null;
  }
};

// Obtener quiniela actual (más reciente y activa)
export const getCurrentQuiniela = async () => {
  try {
    const quinielasRef = collection(db, 'quinielas');
    const q = query(
      quinielasRef,
      where('isActive', '==', true),
      where('status', 'in', ['open', 'closed']),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current quiniela:', error);
    return null;
  }
};

// Obtener todas las quinielas
export const getAllQuinielas = async () => {
  try {
    const quinielasRef = collection(db, 'quinielas');
    const q = query(quinielasRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const quinielas = [];
    
    querySnapshot.forEach((doc) => {
      quinielas.push({ id: doc.id, ...doc.data() });
    });
    
    return quinielas;
  } catch (error) {
    console.error('Error getting all quinielas:', error);
    return [];
  }
};

// Actualizar estado de quiniela
export const updateQuinielaStatus = async (quinielaId, status) => {
  try {
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    await updateDoc(quinielaRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating quiniela status:', error);
    return false;
  }
};

// Añadir participante a quiniela
export const addParticipantToQuiniela = async (quinielaId, userId) => {
  try {
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    const quinielaSnap = await getDoc(quinielaRef);
    
    if (quinielaSnap.exists()) {
      const quinielaData = quinielaSnap.data();
      const participants = quinielaData.participants || [];
      
      if (!participants.includes(userId)) {
        participants.push(userId);
        
        await updateDoc(quinielaRef, {
          participants,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding participant to quiniela:', error);
    return false;
  }
};

// Verificar si quiniela está abierta para predicciones
export const isQuinielaOpen = (quiniela) => {
  if (!quiniela || quiniela.status !== 'open') {
    return false;
  }
  
  const deadline = quiniela.deadline?.toDate ? quiniela.deadline.toDate() : new Date(quiniela.deadline);
  return new Date() < deadline;
};

// Obtener tiempo restante para deadline
export const getTimeUntilDeadline = (deadline) => {
  const deadlineDate = deadline?.toDate ? deadline.toDate() : new Date(deadline);
  const now = new Date();
  const timeDiff = deadlineDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return { expired: true, text: 'Tiempo agotado' };
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
  } else if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m` };
  } else {
    return { expired: false, text: `${minutes}m` };
  }
};

// Generar número de semana actual
export const getCurrentWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
};