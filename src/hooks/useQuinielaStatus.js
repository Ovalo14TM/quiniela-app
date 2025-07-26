// src/hooks/useQuinielaStatus.js - Hook personalizado para manejar el estado de la quiniela
import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentQuiniela, 
  getQuinielaStatus, 
  getTimeUntilDeadline,
  hasFirstMatchStarted 
} from '../services/quinielaService';

export const useQuinielaStatus = (refreshInterval = 30000) => {
  const [quiniela, setQuiniela] = useState(null);
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar datos de la quiniela
  const loadQuinielaData = useCallback(async () => {
    try {
      setError(null);
      const currentQuiniela = await getCurrentQuiniela();
      setQuiniela(currentQuiniela);

      if (currentQuiniela) {
        const quinielaStatus = getQuinielaStatus(currentQuiniela);
        setStatus(quinielaStatus);

        if (quinielaStatus.isOpen) {
          const timeRemaining = getTimeUntilDeadline(currentQuiniela.deadline);
          setTimeLeft(timeRemaining);
        } else {
          setTimeLeft(null);
        }
      } else {
        setStatus(null);
        setTimeLeft(null);
      }
    } catch (err) {
      console.error('Error loading quiniela data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para actualizar solo el tiempo (más ligera)
  const updateTimeOnly = useCallback(() => {
    if (quiniela && status?.isOpen) {
      const timeRemaining = getTimeUntilDeadline(quiniela.deadline);
      setTimeLeft(timeRemaining);

      // Si el tiempo expiró, recargar completamente
      if (timeRemaining.expired || hasFirstMatchStarted(quiniela)) {
        loadQuinielaData();
      }
    }
  }, [quiniela, status, loadQuinielaData]);

  // Cargar datos iniciales
  useEffect(() => {
    loadQuinielaData();
  }, [loadQuinielaData]);

  // Configurar intervalos de actualización
  useEffect(() => {
    if (!refreshInterval || loading) return;

    // Intervalo principal (completo)
    const fullRefreshInterval = setInterval(loadQuinielaData, refreshInterval);

    // Intervalo para tiempo (cada 10 segundos si está abierta)
    let timeInterval;
    if (status?.isOpen) {
      timeInterval = setInterval(updateTimeOnly, 10000);
    }

    return () => {
      clearInterval(fullRefreshInterval);
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [refreshInterval, loading, status, loadQuinielaData, updateTimeOnly]);

  // Funciones utilitarias
  const canEdit = status?.canEdit || false;
  const isOpen = status?.isOpen || false;
  const isCritical = timeLeft?.isCritical || false;
  const isUrgent = timeLeft?.isUrgent || false;

  // Función para obtener mensaje de estado
  const getStatusMessage = () => {
    if (!quiniela) return 'No hay quiniela activa';
    if (!status) return 'Cargando estado...';
    
    if (status.reason === 'first_match_started') {
      return '🔒 El primer partido ya comenzó - Predicciones cerradas';
    }
    
    if (status.reason === 'deadline_passed') {
      return '⏰ Tiempo agotado - Predicciones cerradas';
    }
    
    if (status.reason === 'manually_closed') {
      return '🔒 Quiniela cerrada manualmente';
    }
    
    if (status.reason === 'finished') {
      return '✅ Quiniela terminada';
    }
    
    if (status.isOpen && timeLeft) {
      if (timeLeft.isCritical) {
        return `🚨 ¡ÚLTIMO LLAMADO! Solo quedan ${timeLeft.text}`;
      }
      if (timeLeft.isUrgent) {
        return `⚠️ ¡Tiempo limitado! Quedan ${timeLeft.text}`;
      }
      return `⏰ Tiempo restante: ${timeLeft.text}`;
    }
    
    return status.message;
  };

  // Función para obtener color de estado
  const getStatusColor = () => {
    if (!status?.isOpen) return '#ef4444'; // Rojo para cerrada
    if (isCritical) return '#dc2626';       // Rojo oscuro para crítico
    if (isUrgent) return '#f59e0b';         // Amarillo para urgente
    return '#10b981';                       // Verde para normal
  };

  // Función para obtener ícono de estado
  const getStatusIcon = () => {
    if (!quiniela) return '📋';
    if (!status?.isOpen) return '🔒';
    if (isCritical) return '🚨';
    if (isUrgent) return '⚠️';
    return '✅';
  };

  return {
    // Datos principales
    quiniela,
    status,
    timeLeft,
    loading,
    error,

    // Estados booleanos
    canEdit,
    isOpen,
    isCritical,
    isUrgent,

    // Funciones utilitarias
    getStatusMessage,
    getStatusColor,
    getStatusIcon,
    refresh: loadQuinielaData,

    // Datos calculados
    hasQuiniela: !!quiniela,
    statusReason: status?.reason,
    timeText: timeLeft?.text,
    fullTimeText: timeLeft?.fullText
  };
};

// Hook simplificado solo para verificar si se puede editar
export const useCanEdit = () => {
  const { canEdit, loading } = useQuinielaStatus();
  return { canEdit, loading };
};

// Hook para notificaciones de estado
export const useQuinielaNotifications = () => {
  const quinielaStatus = useQuinielaStatus();
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    if (!quinielaStatus.quiniela || quinielaStatus.loading) return;

    const { status, timeLeft, isCritical, isUrgent } = quinielaStatus;

    let notification = null;

    if (!status?.isOpen) {
      notification = {
        type: 'error',
        title: 'Quiniela cerrada',
        message: quinielaStatus.getStatusMessage(),
        persistent: true
      };
    } else if (isCritical) {
      notification = {
        type: 'error',
        title: '¡ÚLTIMO LLAMADO!',
        message: `Solo quedan ${timeLeft.text} para completar predicciones`,
        persistent: true
      };
    } else if (isUrgent) {
      notification = {
        type: 'warning',
        title: 'Tiempo limitado',
        message: `Quedan ${timeLeft.text} para completar predicciones`,
        persistent: false
      };
    }

    // Solo actualizar si la notificación cambió
    if (JSON.stringify(notification) !== JSON.stringify(lastNotification)) {
      setLastNotification(notification);
    }
  }, [quinielaStatus, lastNotification]);

  return {
    ...quinielaStatus,
    notification: lastNotification
  };
};

export default useQuinielaStatus;