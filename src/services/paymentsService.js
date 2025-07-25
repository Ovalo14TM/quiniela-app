// src/services/paymentsService.js
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

// Crear registro de pago
export const createPayment = async (paymentData) => {
  try {
    const paymentId = `${paymentData.quinielaId}_${paymentData.fromUser}_${paymentData.toUser}`;
    const paymentRef = doc(db, 'payments', paymentId);
    
    const payment = {
      id: paymentId,
      quinielaId: paymentData.quinielaId,
      fromUser: paymentData.fromUser,
      toUser: paymentData.toUser,
      amount: paymentData.amount,
      status: 'pending', // 'pending', 'paid', 'disputed'
      reason: paymentData.reason || 'Quiniela perdida',
      createdAt: serverTimestamp(),
      dueDate: paymentData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      remindersSent: 0,
      lastReminderAt: null,
      paidAt: null,
      confirmedBy: null,
      notes: paymentData.notes || '',
      paymentMethod: null // 'cash', 'transfer', 'app'
    };
    
    await setDoc(paymentRef, payment);
    console.log('💰 Pago creado:', paymentId);
    
    return paymentRef;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

// Marcar pago como realizado
export const markPaymentAsPaid = async (paymentId, paidByUserId, paymentMethod = null, notes = '') => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (!paymentSnap.exists()) {
      throw new Error('Pago no encontrado');
    }
    
    const payment = paymentSnap.data();
    
    await updateDoc(paymentRef, {
      status: 'paid',
      paidAt: serverTimestamp(),
      confirmedBy: paidByUserId,
      paymentMethod: paymentMethod,
      notes: notes,
      updatedAt: serverTimestamp()
    });
    
    // Actualizar balance de usuarios
    await updateUserBalance(payment.fromUser, -payment.amount);
    await updateUserBalance(payment.toUser, payment.amount);
    
    console.log('✅ Pago marcado como pagado:', paymentId);
    return true;
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    return false;
  }
};

// Disputar un pago
export const disputePayment = async (paymentId, disputedByUserId, reason) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    await updateDoc(paymentRef, {
      status: 'disputed',
      disputedBy: disputedByUserId,
      disputeReason: reason,
      disputedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('⚠️ Pago disputado:', paymentId);
    return true;
  } catch (error) {
    console.error('Error disputing payment:', error);
    return false;
  }
};

// Obtener pagos de un usuario
export const getUserPayments = async (userId) => {
  try {
    const paymentsRef = collection(db, 'payments');
    
    // Pagos que debe hacer
    const paymentsDueQuery = query(
      paymentsRef,
      where('fromUser', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    // Pagos que debe recibir
    const paymentsToReceiveQuery = query(
      paymentsRef,
      where('toUser', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const [paymentsDueSnap, paymentsToReceiveSnap] = await Promise.all([
      getDocs(paymentsDueQuery),
      getDocs(paymentsToReceiveQuery)
    ]);
    
    const paymentsDue = [];
    const paymentsToReceive = [];
    
    paymentsDueSnap.forEach((doc) => {
      paymentsDue.push({ id: doc.id, ...doc.data() });
    });
    
    paymentsToReceiveSnap.forEach((doc) => {
      paymentsToReceive.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      paymentsDue,
      paymentsToReceive,
      totalOwed: paymentsDue
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      totalToReceive: paymentsToReceive
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0)
    };
    
  } catch (error) {
    console.error('Error getting user payments:', error);
    return {
      paymentsDue: [],
      paymentsToReceive: [],
      totalOwed: 0,
      totalToReceive: 0
    };
  }
};

// Obtener todos los pagos (admin)
export const getAllPayments = async () => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    
    return payments;
  } catch (error) {
    console.error('Error getting all payments:', error);
    return [];
  }
};

// Obtener resumen financiero global
export const getFinancialSummary = async () => {
  try {
    const payments = await getAllPayments();
    
    const summary = {
      totalTransactions: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      disputedAmount: payments
        .filter(p => p.status === 'disputed')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingCount: payments.filter(p => p.status === 'pending').length,
      paidCount: payments.filter(p => p.status === 'paid').length,
      disputedCount: payments.filter(p => p.status === 'disputed').length,
      overdueCount: payments.filter(p => 
        p.status === 'pending' && 
        new Date(p.dueDate?.toDate ? p.dueDate.toDate() : p.dueDate) < new Date()
      ).length
    };
    
    // Análisis por usuario
    const userBalances = new Map();
    
    payments.forEach(payment => {
      if (payment.status === 'paid') {
        // Actualizar balances
        if (!userBalances.has(payment.fromUser)) {
          userBalances.set(payment.fromUser, { paid: 0, received: 0, pending: 0 });
        }
        if (!userBalances.has(payment.toUser)) {
          userBalances.set(payment.toUser, { paid: 0, received: 0, pending: 0 });
        }
        
        userBalances.get(payment.fromUser).paid += payment.amount;
        userBalances.get(payment.toUser).received += payment.amount;
      }
      
      if (payment.status === 'pending') {
        if (!userBalances.has(payment.fromUser)) {
          userBalances.set(payment.fromUser, { paid: 0, received: 0, pending: 0 });
        }
        userBalances.get(payment.fromUser).pending += payment.amount;
      }
    });
    
    summary.userBalances = Array.from(userBalances.entries()).map(([userId, balance]) => ({
      userId,
      ...balance,
      netBalance: balance.received - balance.paid
    }));
    
    return summary;
    
  } catch (error) {
    console.error('Error getting financial summary:', error);
    return null;
  }
};

// Actualizar balance de usuario
const updateUserBalance = async (userId, amount) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const newBalance = (userData.totalWinnings || 0) + amount;
      
      await updateDoc(userRef, {
        totalWinnings: newBalance,
        updatedAt: serverTimestamp()
      });
      
      console.log(`💰 Balance actualizado para ${userId}: ${amount > 0 ? '+' : ''}${amount}`);
    }
  } catch (error) {
    console.error('Error updating user balance:', error);
  }
};

// Enviar recordatorio de pago
export const sendPaymentReminder = async (paymentId) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (!paymentSnap.exists()) {
      throw new Error('Pago no encontrado');
    }
    
    const payment = paymentSnap.data();
    
    await updateDoc(paymentRef, {
      remindersSent: (payment.remindersSent || 0) + 1,
      lastReminderAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Aquí puedes integrar con servicio de notificaciones/email
    console.log('📧 Recordatorio enviado para pago:', paymentId);
    
    return true;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return false;
  }
};

// Crear pagos automáticamente cuando termine una quiniela
export const createPaymentsFromQuiniela = async (quinielaId, winners, ranking) => {
  try {
    const payments = [];
    const paymentAmount = 50; // $50 MXN base
    
    if (winners.length === 1) {
      // 1 ganador: los otros pagan $50 cada uno
      const winner = winners[0];
      const losers = ranking.filter(user => user.userId !== winner.userId);
      
      for (const loser of losers) {
        const payment = await createPayment({
          quinielaId,
          fromUser: loser.userId,
          toUser: winner.userId,
          amount: paymentAmount,
          reason: `Quiniela ${quinielaId} - 1er lugar`,
          notes: `${winner.totalPoints} vs ${loser.totalPoints} puntos`
        });
        payments.push(payment);
      }
      
    } else if (winners.length === 2) {
      // 2 ganadores: el 3ro paga $25 a cada uno
      const thirdPlace = ranking.find(user => 
        !winners.some(winner => winner.userId === user.userId)
      );
      
      if (thirdPlace) {
        for (const winner of winners) {
          const payment = await createPayment({
            quinielaId,
            fromUser: thirdPlace.userId,
            toUser: winner.userId,
            amount: paymentAmount / 2,
            reason: `Quiniela ${quinielaId} - Empate 1er lugar`,
            notes: `Empate en ${winner.totalPoints} puntos`
          });
          payments.push(payment);
        }
      }
    }
    // Si hay 3 ganadores (triple empate), no se crean pagos
    
    console.log(`💰 ${payments.length} pagos creados para quiniela ${quinielaId}`);
    return payments;
    
  } catch (error) {
    console.error('Error creating payments from quiniela:', error);
    return [];
  }
};

// Obtener historial de pagos por quiniela
export const getPaymentsByQuiniela = async (quinielaId) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('quinielaId', '==', quinielaId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const payments = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    
    return payments;
  } catch (error) {
    console.error('Error getting payments by quiniela:', error);
    return [];
  }
};