// src/services/quinielaService.js - Versión mejorada con auto-deadline
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

// Crear nueva quiniela semanal con deadline automático
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
      deadline: quinielaData.deadline, // Auto-calculado desde CreateQuiniela
      firstMatchDate: quinielaData.firstMatchDate, // Fecha del primer partido
      lastMatchDate: quinielaData.lastMatchDate, // Fecha del último partido
      createdBy: quinielaData.createdBy,
      createdAt: serverTimestamp(),
      participants: [],
      totalPredictions: 0,
      isActive: true,
      autoDeadline: true, // Flag para indicar que usa deadline automático
      notificationsSent: 0,
      lastNotificationAt: null
    };
    
    await setDoc(quinielaRef, quinielaDoc);
    
    // Programar notificaciones automáticas
    await scheduleQuinielaNotifications(quinielaId, quinielaDoc);
    
    console.log(`✅ Quiniela creada: ${quinielaId}`);
    console.log(`📅 Primer partido: ${quinielaData.firstMatchDate}`);
    console.log(`⏰ Deadline: ${quinielaData.deadline}`);
    
    return quinielaRef;
  } catch (error) {
    console.error('Error creating quiniela:', error);
    throw error;
  }
};

// Programar notificaciones para la quiniela
const scheduleQuinielaNotifications = async (quinielaId, quinielaData) => {
  try {
    const notifications = [];
    const now = new Date();
    const deadline = quinielaData.deadline;
    
    // Notificación: 24 horas antes del deadline
    const notification24h = new Date(deadline.getTime() - (24 * 60 * 60 * 1000));
    if (notification24h > now) {
      notifications.push({
        type: '24h_reminder',
        scheduledFor: notification24h,
        message: `🏆 ¡Nueva quiniela disponible! Tienes 24 horas para hacer tus predicciones.`
      });
    }
    
    // Notificación: 2 horas antes del deadline
    const notification2h = new Date(deadline.getTime() - (2 * 60 * 60 * 1000));
    if (notification2h > now) {
      notifications.push({
        type: '2h_reminder',
        scheduledFor: notification2h,
        message: `⏰ ¡Últimas 2 horas! No olvides completar tus predicciones.`
      });
    }
    
    // Notificación: 30 minutos antes del deadline
    const notification30m = new Date(deadline.getTime() - (30 * 60 * 1000));
    if (notification30m > now) {
      notifications.push({
        type: '30m_warning',
        scheduledFor: notification30m,
        message: `🚨 ¡ÚLTIMO LLAMADO! Solo quedan 30 minutos para hacer predicciones.`
      });
    }
    
    // Guardar programación de notificaciones
    if (notifications.length > 0) {
      const notificationsRef = doc(db, 'scheduled_notifications', quinielaId);
      await setDoc(notificationsRef, {
        quinielaId,
        notifications,
        createdAt: serverTimestamp()
      });
      
      console.log(`📧 ${notifications.length} notificaciones programadas para ${quinielaId}`);
    }
    
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

export const getCurrentQuiniela = async () => {
  try {
    const quinielasRef = collection(db, 'quinielas');
    const q = query(
      quinielasRef,
      where('isActive', '==', true),
      where('status', 'in', ['open', 'closed', 'in_progress']),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const quinielaDoc = querySnapshot.docs[0];
      const quinielaData = { id: quinielaDoc.id, ...quinielaDoc.data() };
      console.log('✅ Quiniela activa cargada:', quinielaData.title);
      return quinielaData;
    }
    
    console.log('❌ No se encontró ninguna quiniela activa');
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};


// Verificar y actualizar el estado de la quiniela automáticamente
const checkAndUpdateQuinielaStatus = async (quiniela) => {
  try {
    const now = new Date();
    const deadline = quiniela.deadline?.toDate ? quiniela.deadline.toDate() : new Date(quiniela.deadline);
    const firstMatchDate = quiniela.firstMatchDate?.toDate ? quiniela.firstMatchDate.toDate() : new Date(quiniela.firstMatchDate);
    
    let newStatus = quiniela.status;
    
    // Si ya pasó el deadline y está abierta, cerrarla
    if (now >= deadline && quiniela.status === 'open') {
      newStatus = 'closed';
      console.log(`🔒 Auto-cerrando quiniela ${quiniela.id} - deadline alcanzado`);
    }
    
    // Si ya comenzó el primer partido y está cerrada, marcarla como en progreso
    if (now >= firstMatchDate && quiniela.status === 'closed') {
      newStatus = 'in_progress';
      console.log(`⚽ Quiniela ${quiniela.id} en progreso - primer partido comenzó`);
    }
    
    // Actualizar estado si cambió
    if (newStatus !== quiniela.status) {
      const quinielaRef = doc(db, 'quinielas', quiniela.id);
      await updateDoc(quinielaRef, {
        status: newStatus,
        lastStatusUpdate: serverTimestamp()
      });
    }
    
  } catch (error) {
    console.error('Error checking quiniela status:', error);
  }
};

// Obtener todas las quinielas con información adicional
export const getAllQuinielas = async () => {
  try {
    const quinielasRef = collection(db, 'quinielas');
    const q = query(quinielasRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const quinielas = [];
    
    for (const doc of querySnapshot.docs) {
      const quinielaData = { id: doc.id, ...doc.data() };
      
      // Calcular estadísticas adicionales
      const stats = await getQuinielaStats(quinielaData.id);
      quinielaData.stats = stats;
      
      quinielas.push(quinielaData);
    }
    
    return quinielas;
  } catch (error) {
    console.error('Error getting all quinielas:', error);
    return [];
  }
};

// Obtener estadísticas básicas de una quiniela
const getQuinielaStats = async (quinielaId) => {
  try {
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('quinielaId', '==', quinielaId));
    const querySnapshot = await getDocs(q);
    
    const userParticipation = new Set();
    let totalPredictions = 0;
    let completedPredictions = 0;
    
    querySnapshot.forEach((doc) => {
      const prediction = doc.data();
      userParticipation.add(prediction.userId);
      totalPredictions++;
      
      if (prediction.homeScore !== undefined && prediction.awayScore !== undefined) {
        completedPredictions++;
      }
    });
    
    return {
      totalParticipants: userParticipation.size,
      totalPredictions,
      completedPredictions,
      completionRate: totalPredictions > 0 ? (completedPredictions / totalPredictions) * 100 : 0
    };
    
  } catch (error) {
    console.error('Error getting quiniela stats:', error);
    return {
      totalParticipants: 0,
      totalPredictions: 0,
      completedPredictions: 0,
      completionRate: 0
    };
  }
};

export const updateQuinielaStatus = async (quinielaId, status, reason = '') => {
  try {
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      lastStatusUpdate: serverTimestamp()
    };

    // Si se está cerrando manualmente, agregar información adicional
    if (status === 'closed') {
      updateData.closedManually = true;
      updateData.closureReason = reason || 'Cerrada por administrador';
      updateData.closedAt = serverTimestamp();
    }

    // Si se está reabriendo
    if (status === 'open') {
      updateData.closedManually = false;
      updateData.reopenedAt = serverTimestamp();
    }

    await updateDoc(quinielaRef, updateData);
    
    console.log(`📝 Estado de quiniela ${quinielaId} actualizado a: ${status}`);
    
    // Opcional: Enviar notificación a usuarios (implementar después)
    if (status === 'closed') {
      console.log('🔔 Notificando a usuarios sobre cierre de quiniela');
      // Aquí podrías agregar lógica para notificar a usuarios
    }
    
    return true;
  } catch (error) {
    console.error('Error updating quiniela status:', error);
    return false;
  }
};

// Añadir participante a quiniela automáticamente
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
        
        console.log(`👤 Usuario ${userId} añadido a quiniela ${quinielaId}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding participant to quiniela:', error);
    return false;
  }
};

export const isQuinielaOpen = (quiniela) => {
  if (!quiniela) {
    return false;
  }
  
  // Si el status no es 'open', definitivamente no está disponible
  if (quiniela.status !== 'open') {
    return false;
  }
  
  // Verificar deadline solo si el status es 'open'
  const deadline = quiniela.deadline?.toDate ? 
    quiniela.deadline.toDate() : 
    new Date(quiniela.deadline);
  const now = new Date();
  
  // La quiniela está abierta solo si:
  // 1. El status es 'open' Y
  // 2. Aún no se ha cumplido el deadline
  return now < deadline;
};

// Obtener tiempo restante para deadline con más detalle
export const getTimeUntilDeadline = (deadline) => {
  try {
    const deadlineDate = deadline?.toDate ? deadline.toDate() : new Date(deadline);
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return { 
        expired: true, 
        text: 'Tiempo agotado',
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    let text;
    if (days > 0) {
      text = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      text = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      text = `${minutes}m ${seconds}s`;
    } else {
      text = `${seconds}s`;
    }
    
    return { 
      expired: false, 
      text,
      totalSeconds: Math.floor(timeDiff / 1000),
      days,
      hours,
      minutes,
      seconds,
      isUrgent: timeDiff < (2 * 60 * 60 * 1000), // Menos de 2 horas
      isCritical: timeDiff < (30 * 60 * 1000) // Menos de 30 minutos
    };
    
  } catch (error) {
    console.error('Error calculating time until deadline:', error);
    return { 
      expired: true, 
      text: 'Error calculando tiempo',
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
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

// Obtener próximas quinielas (para programación)
export const getUpcomingQuinielas = async () => {
  try {
    const quinielasRef = collection(db, 'quinielas');
    const now = new Date();
    
    const q = query(
      quinielasRef,
      where('status', '==', 'open'),
      where('deadline', '>', now),
      orderBy('deadline', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const upcoming = [];
    
    querySnapshot.forEach((doc) => {
      upcoming.push({ id: doc.id, ...doc.data() });
    });
    
    return upcoming;
    
  } catch (error) {
    console.error('Error getting upcoming quinielas:', error);
    return [];
  }
};

// Finalizar quiniela y calcular resultados
export const finalizeQuiniela = async (quinielaId) => {
  try {
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    
    await updateDoc(quinielaRef, {
      status: 'finished',
      finishedAt: serverTimestamp(),
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    console.log(`🏁 Quiniela ${quinielaId} finalizada`);
    return true;
    
  } catch (error) {
    console.error('Error finalizing quiniela:', error);
    return false;
  }
};

// Reactivar quiniela (para correcciones)
export const reactivateQuiniela = async (quinielaId) => {
  try {
    const quinielaRef = doc(db, 'quinielas', quinielaId);
    
    await updateDoc(quinielaRef, {
      status: 'open',
      isActive: true,
      reactivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`🔄 Quiniela ${quinielaId} reactivada`);
    return true;
    
  } catch (error) {
    console.error('Error reactivating quiniela:', error);
    return false;
  }
};
export const getQuinielaClosureReason = (quiniela) => {
  if (!quiniela) return 'unknown';
  
  const deadline = quiniela.deadline?.toDate ? 
    quiniela.deadline.toDate() : 
    new Date(quiniela.deadline);
  const now = new Date();
  
  // Si el estado es 'closed' pero aún no se ha cumplido el deadline
  if (quiniela.status === 'closed' && now < deadline) {
    return 'manual'; // Cerrada manualmente por admin
  }
  
  // Si el deadline ya pasó
  if (now >= deadline) {
    return 'automatic'; // Cerrada automáticamente por tiempo
  }
  
  // Si está abierta
  if (quiniela.status === 'open') {
    return 'open';
  }
  
  return 'other';
};