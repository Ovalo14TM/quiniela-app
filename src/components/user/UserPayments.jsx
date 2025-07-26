// src/components/user/UserPayments.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { getUserPayments, markPaymentAsPaid } from '../../services/paymentsService';
import { getAllUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

export default function UserPayments() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState({
    paymentsDue: [],
    paymentsToReceive: [],
    totalOwed: 0,
    totalToReceive: 0
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (currentUser) {
      loadPaymentData();
    }
  }, [currentUser]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const [paymentsData, usersData] = await Promise.all([
        getUserPayments(currentUser.uid),
        getAllUsers()
      ]);
      
      setPayments(paymentsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
    setLoading(false);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || `Usuario ${userId.slice(-6)}`;
  };

  const handleConfirmPayment = async (paymentId, method) => {
    try {
      const success = await markPaymentAsPaid(paymentId, currentUser.uid, method);
      if (success) {
        alert('✅ Pago confirmado. Será verificado por el administrador.');
        loadPaymentData();
      } else {
        alert('❌ Error al confirmar el pago');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('❌ Error al procesar la confirmación');
    }
  };

  const TabButton = ({ tabId, label, isActive, onClick, badge }) => (
    <button
      onClick={() => onClick(tabId)}
      style={{
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        background: isActive 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
          e.target.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'translateY(0)';
        }
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}>
          {badge}
        </span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
          Cargando información de pagos...
        </p>
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          💰 Mis Pagos
        </h2>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <TabButton
            tabId="summary"
            label="📊 Resumen"
            isActive={activeTab === 'summary'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="owed"
            label="💸 Debo Pagar"
            isActive={activeTab === 'owed'}
            onClick={setActiveTab}
            badge={payments.paymentsDue.filter(p => p.status === 'pending').length}
          />
          <TabButton
            tabId="receiving"
            label="💰 Me Deben"
            isActive={activeTab === 'receiving'}
            onClick={setActiveTab}
            badge={payments.paymentsToReceive.filter(p => p.status === 'pending').length}
          />
          <TabButton
            tabId="history"
            label="📚 Historial"
            isActive={activeTab === 'history'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Resumen */}
      {activeTab === 'summary' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          {/* Tarjetas de Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)',
                borderRadius: '0 16px 0 100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '32px', filter: 'brightness(1.2)' }}>😰</span>
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0
                  }}>
                    💸 Debo Pagar
                  </h3>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '40px',
                    fontWeight: 'bold',
                    color: '#ef4444',
                    margin: '0 0 8px 0',
                    lineHeight: 1
                  }}>
                    ${payments.totalOwed}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '0 0 16px 0'
                  }}>
                    {payments.paymentsDue.filter(p => p.status === 'pending').length} pagos pendientes
                  </div>
                </div>
                
                {payments.totalOwed > 0 && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.4)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      💡 <strong>Tip:</strong> Paga pronto para evitar recordatorios
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
                borderRadius: '0 16px 0 100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '32px', filter: 'brightness(1.2)' }}>😊</span>
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0
                  }}>
                    💰 Me Deben
                  </h3>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '40px',
                    fontWeight: 'bold',
                    color: '#10b981',
                    margin: '0 0 8px 0',
                    lineHeight: 1
                  }}>
                    ${payments.totalToReceive}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '0 0 16px 0'
                  }}>
                    {payments.paymentsToReceive.filter(p => p.status === 'pending').length} pagos esperando
                  </div>
                </div>
                
                {payments.totalToReceive > 0 && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6ee7b7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🎉 <strong>¡Genial!</strong> Tienes dinero por cobrar
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance General */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 24px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              ⚖️ Balance General
            </h3>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: payments.totalToReceive - payments.totalOwed >= 0 
                  ? '#10b981' 
                  : '#ef4444'
              }}>
                ${payments.totalToReceive - payments.totalOwed >= 0 ? '+' : ''}
                {payments.totalToReceive - payments.totalOwed}
              </div>
              <div style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                {payments.totalToReceive - payments.totalOwed >= 0 
                  ? '🎉 Estás en positivo' 
                  : '😅 Estás en negativo'
                }
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          {(payments.totalOwed > 0 || payments.totalToReceive > 0) && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 16px 0'
              }}>
                ⚡ Acciones Rápidas
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                {payments.totalOwed > 0 && (
                  <button
                    onClick={() => setActiveTab('owed')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💸 Ver Pagos Pendientes
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                      Revisa qué debes pagar
                    </div>
                  </button>
                )}
                
                {payments.totalToReceive > 0 && (
                  <button
                    onClick={() => setActiveTab('receiving')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(16, 185, 129, 0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(16, 185, 129, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💰 Ver Dinero por Cobrar
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                      Revisa quién te debe
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagos que Debo */}
      {activeTab === 'owed' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            💸 Pagos Pendientes ({payments.paymentsDue.filter(p => p.status === 'pending').length})
          </h3>
          
          <PaymentsList 
            payments={payments.paymentsDue.filter(p => p.status === 'pending')}
            getUserName={getUserName}
            type="owed"
            onConfirmPayment={handleConfirmPayment}
          />
        </div>
      )}

      {/* Pagos que Me Deben */}
      {activeTab === 'receiving' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            💰 Dinero por Cobrar ({payments.paymentsToReceive.filter(p => p.status === 'pending').length})
          </h3>
          
          <PaymentsList 
            payments={payments.paymentsToReceive.filter(p => p.status === 'pending')}
            getUserName={getUserName}
            type="receiving"
          />
        </div>
      )}

      {/* Historial */}
      {activeTab === 'history' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📚 Historial de Pagos
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 12px 0'
              }}>
                ✅ Pagos Completados
              </h4>
              <PaymentsList 
                payments={[...payments.paymentsDue, ...payments.paymentsToReceive].filter(p => p.status === 'paid')}
                getUserName={getUserName}
                type="history"
              />
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Componente para lista de pagos
function PaymentsList({ payments, getUserName, type, onConfirmPayment }) {
  if (payments.length === 0) {
    const emptyMessages = {
      owed: { icon: '🎉', text: '¡Perfecto! No tienes pagos pendientes' },
      receiving: { icon: '📭', text: 'Nadie te debe dinero por ahora' },
      history: { icon: '📋', text: 'No hay historial de pagos aún' }
    };
    
    const message = emptyMessages[type] || { icon: '💰', text: 'No hay pagos' };
    
    return (
      <div style={{
        textAlign: 'center',
        padding: '64px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>
          {message.icon}
        </div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          margin: 0
        }}>
          {message.text}
        </p>
      </div>
    );
  }

  const handleQuickPay = (payment) => {
    const methods = ['efectivo', 'transferencia', 'app'];
    const method = prompt(`¿Cómo pagaste?\n${methods.map((m, i) => `${i + 1}. ${m}`).join('\n')}`);
    
    if (method && methods.includes(method.toLowerCase())) {
      onConfirmPayment(payment.id, method.toLowerCase());
    } else if (method) {
      alert('Método no válido. Usa: efectivo, transferencia o app');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {payments.map((payment) => {
        const isOverdue = payment.status === 'pending' && 
          new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate) < new Date();
        
        return (
          <div 
            key={payment.id} 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: isOverdue 
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : type === 'receiving' 
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '16px'
                  }}>
                    {type === 'owed' 
                      ? `Pagas a ${getUserName(payment.toUser)}`
                      : `${getUserName(payment.fromUser)} te paga`
                    }
                  </span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#10b981'
                  }}>
                    ${payment.amount}
                  </span>
                  {isOverdue && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239, 68, 68, 0.4)'
                    }}>
                      ⚠️ Vencido
                    </span>
                  )}
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📋 {payment.reason}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📅 {new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate).toLocaleDateString()}
                  </div>
                  {payment.notes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📝 {payment.notes}
                    </div>
                  )}
                  {payment.paidAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      ✅ Pagado: {payment.paidAt.toDate().toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              {type === 'owed' && payment.status === 'pending' && (
                <button
                  onClick={() => handleQuickPay(payment)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  💳 Ya Pagué
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}