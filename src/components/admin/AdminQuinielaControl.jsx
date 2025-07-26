import React, { useState, useEffect } from 'react';
import { 
  getCurrentQuiniela, 
  updateQuinielaStatus, 
  isQuinielaOpen,
  getTimeUntilDeadline 
} from '../../services/quinielaService';

export default function AdminQuinielaControl() {
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    loadQuiniela();
    
    // Actualizar cada 10 segundos
    const interval = setInterval(loadQuiniela, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQuiniela = async () => {
    try {
      const quiniela = await getCurrentQuiniela();
      setCurrentQuiniela(quiniela);
      
      if (quiniela) {
        const time = getTimeUntilDeadline(quiniela.deadline);
        setTimeLeft(time);
      }
    } catch (error) {
      console.error('Error loading quiniela:', error);
    }
    setLoading(false);
  };

  const handleCloseQuiniela = async () => {
    const confirm = window.confirm(
      '🔒 ¿Cerrar la quiniela antes de tiempo?\n\n' +
      '• Los usuarios ya no podrán hacer/editar predicciones\n' +
      '• Esta acción se puede revertir si es necesario\n\n' +
      '¿Continuar?'
    );

    if (!confirm) return;

    setUpdating(true);
    try {
      const success = await updateQuinielaStatus(currentQuiniela.id, 'closed');
      
      if (success) {
        alert('✅ Quiniela cerrada exitosamente');
        loadQuiniela(); // Recargar datos
      } else {
        alert('❌ Error al cerrar la quiniela');
      }
    } catch (error) {
      console.error('Error closing quiniela:', error);
      alert('❌ Error al cerrar la quiniela');
    }
    setUpdating(false);
  };

  const handleReopenQuiniela = async () => {
    const confirm = window.confirm(
      '🔓 ¿Reabrir la quiniela?\n\n' +
      '• Los usuarios podrán hacer/editar predicciones otra vez\n' +
      '• Solo hasta el deadline original\n\n' +
      '¿Continuar?'
    );

    if (!confirm) return;

    setUpdating(true);
    try {
      const success = await updateQuinielaStatus(currentQuiniela.id, 'open');
      
      if (success) {
        alert('✅ Quiniela reabierta exitosamente');
        loadQuiniela(); // Recargar datos
      } else {
        alert('❌ Error al reabrir la quiniela');
      }
    } catch (error) {
      console.error('Error reopening quiniela:', error);
      alert('❌ Error al reabrir la quiniela');
    }
    setUpdating(false);
  };

  const handleForceFinish = async () => {
    const confirm = window.confirm(
      '🏁 ¿Finalizar la quiniela completamente?\n\n' +
      '• Se marcará como terminada\n' +
      '• Ya no se pueden hacer cambios\n' +
      '• Solo usar cuando todos los partidos hayan terminado\n\n' +
      '¿Continuar?'
    );

    if (!confirm) return;

    setUpdating(true);
    try {
      const success = await updateQuinielaStatus(currentQuiniela.id, 'finished');
      
      if (success) {
        alert('✅ Quiniela finalizada exitosamente');
        loadQuiniela(); // Recargar datos
      } else {
        alert('❌ Error al finalizar la quiniela');
      }
    } catch (error) {
      console.error('Error finishing quiniela:', error);
      alert('❌ Error al finalizar la quiniela');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
          Cargando quiniela...
        </p>
      </div>
    );
  }

  if (!currentQuiniela) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 8px 0'
        }}>
          No hay quiniela activa
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
          Crea una nueva quiniela para comenzar
        </p>
      </div>
    );
  }

  const isOpen = isQuinielaOpen(currentQuiniela);
  const deadline = currentQuiniela.deadline?.toDate ? 
    currentQuiniela.deadline.toDate() : 
    new Date(currentQuiniela.deadline);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '32px' }}>🎯</div>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '0 0 4px 0'
          }}>
            Control de Quiniela
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            fontSize: '14px'
          }}>
            Gestiona el estado de la quiniela actual
          </p>
        </div>
      </div>

      {/* Info de la Quiniela */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h4 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 16px 0'
        }}>
          📋 {currentQuiniela.title}
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Estado */}
          <div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              ESTADO ACTUAL
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isOpen ? '#10b981' : 
                          currentQuiniela.status === 'finished' ? '#6b7280' :
                          currentQuiniela.status === 'in_progress' ? '#f59e0b' : '#ef4444'
              }}></div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isOpen ? '#10b981' : 
                      currentQuiniela.status === 'finished' ? '#6b7280' :
                      currentQuiniela.status === 'in_progress' ? '#f59e0b' : '#ef4444'
              }}>
                {isOpen ? '🟢 Abierta' : 
                 currentQuiniela.status === 'finished' ? '🏁 Finalizada' :
                 currentQuiniela.status === 'in_progress' ? '⚽ En progreso' : '🔒 Cerrada'}
              </span>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              DEADLINE ORIGINAL
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              📅 {deadline.toLocaleDateString('es-MX', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Tiempo Restante */}
          <div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              TIEMPO RESTANTE
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: timeLeft?.expired ? '#ef4444' : 
                    timeLeft?.isCritical ? '#f59e0b' : '#10b981'
            }}>
              {timeLeft?.expired ? '⏰ Tiempo agotado' : 
               timeLeft ? `⏳ ${timeLeft.text}` : 'Calculando...'}
            </div>
          </div>

          {/* Partidos */}
          <div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              PARTIDOS
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              ⚽ {currentQuiniela.matches?.length || 0} partidos
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        gap: '12px'
      }}>
        {/* Cerrar Quiniela */}
        {isOpen && (
          <button
            onClick={handleCloseQuiniela}
            disabled={updating}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: updating ? 'not-allowed' : 'pointer',
              opacity: updating ? 0.6 : 1,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!updating) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!updating) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {updating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Cerrando...
              </>
            ) : (
              <>
                🔒 Cerrar Quiniela
              </>
            )}
          </button>
        )}

        {/* Reabrir Quiniela */}
        {!isOpen && currentQuiniela.status === 'closed' && !timeLeft?.expired && (
          <button
            onClick={handleReopenQuiniela}
            disabled={updating}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: updating ? 'not-allowed' : 'pointer',
              opacity: updating ? 0.6 : 1,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!updating) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!updating) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {updating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Reabriendo...
              </>
            ) : (
              <>
                🔓 Reabrir Quiniela
              </>
            )}
          </button>
        )}

        {/* Finalizar Quiniela */}
        {currentQuiniela.status !== 'finished' && (
          <button
            onClick={handleForceFinish}
            disabled={updating}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: updating ? 'not-allowed' : 'pointer',
              opacity: updating ? 0.6 : 1,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!updating) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 8px 25px rgba(107, 114, 128, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!updating) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {updating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Finalizando...
              </>
            ) : (
              <>
                🏁 Finalizar Quiniela
              </>
            )}
          </button>
        )}
      </div>

      {/* CSS para la animación */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}