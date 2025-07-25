// src/services/userService.js
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Crear o actualizar perfil de usuario
export const createUserProfile = async (user, additionalData = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { email } = user;
    const createdAt = new Date();
    
    // Determinar si es admin (primer usuario o email específico)
    const isAdmin = email === 'admin@quiniela.com' || additionalData.isAdmin;
    
    try {
      await setDoc(userRef, {
        email,
        role: isAdmin ? 'admin' : 'user',
        name: additionalData.name || email.split('@')[0],
        totalPoints: 0,
        totalWinnings: 0,
        quinielasWon: 0,
        quinielasPlayed: 0,
        createdAt,
        isActive: true,
        ...additionalData
      });
    } catch (error) {
      console.log('Error creando perfil de usuario:', error);
    }
  }
  
  return userRef;
};

// Obtener perfil de usuario
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.log('Error obteniendo perfil de usuario:', error);
    return null;
  }
};

// Obtener todos los usuarios (solo admin)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users.sort((a, b) => b.totalPoints - a.totalPoints);
  } catch (error) {
    console.log('Error obteniendo usuarios:', error);
    return [];
  }
};

// Actualizar estadísticas de usuario
export const updateUserStats = async (userId, stats) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, stats);
  } catch (error) {
    console.log('Error actualizando estadísticas:', error);
  }
};

// Verificar si el usuario es admin
export const isUserAdmin = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile?.role === 'admin';
  } catch (error) {
    console.log('Error verificando rol de admin:', error);
    return false;
  }
};