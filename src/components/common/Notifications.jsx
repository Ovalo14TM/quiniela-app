// src/components/common/Notifications.jsx - Sistema de notificaciones
import React, { useState, useEffect } from 'react';
import { getCurrentQuiniela, getTimeUntilDeadline, isQuinielaOpen } from '../../services/quinielaService';
import { getUserPredictionsForQuiniela } from '../../services/predictionsService';
import { useAuth } from '../../context/AuthContext';

export default function Notifications() {
  const { currentUser } = useAuth();
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [userPredictions, setUserPredictions] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    loadQuinielaData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadQuinielaData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (currentQuiniela) {
      generateNotifications();
    }
  }, [currentQuiniela, userPredictions, timeLeft]);

  const loadQuinielaData = async () => {
    if (!currentUser) return;

    try {
      const quiniela = await getCurrentQuiniela();
      setCurrentQuiniela(quiniela);

      if (quiniela) {
        // Cargar predicciones del usuario
        const predictions = await getUserPredictionsForQuiniela(currentUser.uid, quiniela.id);
        setUserPredictions(predictions);

        // Calcular tiempo restante
        const time = getTimeUntilDeadline(quiniela.deadline);
        setTimeLeft(time);
      }
    } catch (error) {
      console.error('Error loading quiniela data:', error);
    }
  };

  const generateNotifications = () => {
    if (!currentQuiniela || !timeLeft) {
      setNotifications([]);
      return;
    }

    const newNotifications = [];
    const isOpen = isQuinielaOpen(currentQuiniela);
    const predictionsCount = Object.keys(userPredictions).length;
    const totalMatches = currentQuiniela.matches?.length || 0;
    const hasCompletedPredictions = predictionsCount === totalMatches && totalMatches > 0;

    // Notificación: Nueva quiniela disponible
    if (isOpen && predictionsCount === 0 && !dismissed.has('new_quiniela')) {
      newNotifications.push({
        id: 'new_quiniela',
        type: 'info',
        icon: '🆕',
        title: '¡Nueva quiniela disponible!',
        message: `${currentQuiniela.title} ya está lista para tus predicciones.`,
        action: {
          text: 'Hacer predicciones',
          type: 'primary'
        },
        priority: 'high'
      });
    }

    // Notificación: Predicciones incompletas
    if (isOpen && predictionsCount > 0 && !hasCompletedPredictions && !dismissed.has('incomplete_predictions')) {
      newNotifications.push({
        id: 'incomplete_predictions',
        type: 'warning',
        icon: '⚠️',
        title: 'Predicciones incompletas',
        message: `Te faltan ${totalMatches - predictionsCount} predicciones por completar.`,
        action: {
          text: 'Completar',
          type: 'warning'
        },
        priority: 'medium'
      });
    }

    // Notificación: Tiempo crítico (menos de 2 horas)
    if (isOpen && timeLeft.isUrgent && !timeLeft.isCritical && !dismissed.has('urgent_deadline')) {
      newNotifications.push({
        id: 'urgent_deadline',
        type: 'warning',
        icon: '⏰',
        title: '¡Tiempo limitado!',
        message: `Solo quedan ${timeLeft.text} para hacer predicciones.`,
        action: {
          text: hasCompletedPredictions ? 'Revisar' : 'Completar ahora',
          type: 'warning'
        },
        priority: 'high'
      });
    }

    // Notificación: Último llamado (menos de 30 minutos)
    if (isOpen && timeLeft.isCritical && !dismissed.has('critical_deadline')) {
      newNotifications.push({
        id: 'critical_deadline',
        type: 'error',
        icon: '🚨',
        title: '¡ÚLTIMO LLAMADO!',
        message: `Solo quedan ${timeLeft.text} antes del cierre.`,
        action: {
          text: hasCompletedPredictions ? 'Ya está listo' : '¡Completar YA!',
          type: 'error'
        },
        priority: 'critical',
        autoHide: false
      });
    }

    // Notificación: Predicciones completadas
    if (isOpen && hasCompletedPredictions && !dismissed.has('predictions_complete')) {
      newNotifications.push({
        id: 'predictions_complete',
        type: 'success',
        icon: '✅',
        title: '¡Predicciones completadas!',
        message: `Has completado todas tus predicciones para ${currentQuiniela.title}.`,
        action: {
          text: 'Ver resumen',
          type: 'success'
        },
        priority: 'low',
        autoHide: true
      });
    }

    // Notificación: Quiniela cerrada
    if (!isOpen && timeLeft.expired && !dismissed.has('quiniela_closed')) {
      newNotifications.push({
        id: 'quiniela_closed',
        type: 'info',
        icon: '🔒',
        title: 'Quiniela cerrada',
        message: `${currentQuiniela.title} ya no acepta predicciones. ¡Buena suerte!`,
        priority: 'low',
        autoHide: true
      });
    }

    setNotifications(newNotifications);
  };

  const dismissNotification = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationCard = ({ notification }) => {
    const typeStyles = {
      success: {
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#10b981'
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: '#f59e0b'
      },
      error: {
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ef4444'
      },
      info: {
        background: 'rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#3b82f6'
      }
    };

    const buttonStyles = {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    };

    const style = typeStyles[notification.type] || typeStyles.info;

    return (
      <div style={{
        ...style,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        animation: 'slideInFromTop 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>{notification.icon}</span>
              <h4 style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                margin: 0
              }}>
                {notification.title}
              </h4>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              margin: '0 0 12px 0',
              lineHeight: 1.4
            }}>
              {notification.message}
            </p>
            {notification.action && (
              <button
                style={{
                  background: buttonStyles[notification.action.type] || buttonStyles.primary,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {notification.action.text}
              </button>
            )}
          </div>
          
          <button
            onClick={() => dismissNotification(notification.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Auto-hide notifications
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.autoHide !== false && notification.priority !== 'critical') {
        const timer = setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.priority === 'low' ? 5000 : 10000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '320px',
      maxWidth: '90vw',
      zIndex: 1000,
      maxHeight: '70vh',
      overflowY: 'auto'
    }}>
      {notifications
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        })
        .map(notification => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Scrollbar personalizada */
        div::-webkit-scrollbar {
          width: 4px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}