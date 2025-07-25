// src/hooks/useUser.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserProfile, getUserProfile } from '../services/userService';

export function useUser() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          // Crear perfil si no existe
          await createUserProfile(currentUser);
          
          // Obtener perfil completo
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
        } catch (error) {
          console.error('Error cargando perfil de usuario:', error);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    loadUserProfile();
  }, [currentUser]);

  return {
    userProfile,
    isAdmin,
    loading,
    refreshProfile: async () => {
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        setIsAdmin(profile?.role === 'admin');
      }
    }
  };
}