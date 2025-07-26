// src/components/admin/PaymentsManagement.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { 
  getAllPayments, 
  getFinancialSummary, 
  markPaymentAsPaid, 
  disputePayment,
  sendPaymentReminder 
} from '../../services/paymentsService';
import { getAllUsers } from '../../services/userService';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [paymentsData, usersData, summaryData] = await Promise.all([
        getAllPayments(),
        getAllUsers(),
        getFinancialSummary()
      ]);
      
      setPayments(paymentsData);
      setUsers(usersData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading payments data:', error);
    }
    setLoading(false);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || `Usuario ${userId.slice(-6)}`;
  };

  const handleMarkAsPaid = async (paymentId, paymentMethod, notes) => {
    try {
      const success = await markPaymentAsPaid(paymentId, 'admin', paymentMethod, notes);
      if (success) {
        alert('✅ Pago marcado como pagado');
        loadAllData();
      } else {
        alert('❌ Error al marcar pago como pagado');
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('❌ Error al procesar el pago');
    }
  };

  const handleSendReminder = async (paymentId) => {
    try {
      const success = await sendPaymentReminder(paymentId);
      if (success) {
        alert('📧 Recordatorio enviado');
        loadAllData();
      } else {
        alert('❌ Error al enviar recordatorio');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('❌ Error al enviar recordatorio');
    }
  };

  const TabButton = ({ tabId, label, isActive, onClick, badge }) => (
    <button
      onClick={() => onClick(tabId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '4px'
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
          Cargando datos financieros...
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
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0'
        }}>
          💰 Gestión de Pagos
        </h3>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <TabButton
            tabId="overview"
            label="📊 Resumen"
            isActive={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="pending"
            label="⏳ Pendientes"
            isActive={activeTab === 'pending'}
            onClick={setActiveTab}
            badge={payments.filter(p => p.status === 'pending').length}
          />
          <TabButton
            tabId="paid"
            label="✅ Pagados"
            isActive={activeTab === 'paid'}
            onClick={setActiveTab}
            badge={payments.filter(p => p.status === 'paid').length}
          />
          <TabButton
            tabId="users"
            label="👥 Por Usuario"
            isActive={activeTab === 'users'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Resumen Financiero */}
      {activeTab === 'overview' && summary && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          {/* Métricas Generales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(29, 78, 216, 0.2) 100%)',
                borderRadius: '0 16px 0 100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#3b82f6',
                margin: '0 0 8px 0'
              }}>
                ${summary.totalAmount}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Total Movido
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {summary.totalTransactions} transacciones
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.2) 100%)',
                borderRadius: '0 16px 0 100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>⏳</span>
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#f59e0b',
                margin: '0 0 8px 0'
              }}>
                ${summary.pendingAmount}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Pendiente
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {summary.pendingCount} pagos
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
                borderRadius: '0 16px 0 100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>✅</span>
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#10b981',
                margin: '0 0 8px 0'
              }}>
                ${summary.paidAmount}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Pagado
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {summary.paidCount} completados
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)',
                borderRadius: '0 16px 0 100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ef4444',
                margin: '0 0 8px 0'
              }}>
                {summary.overdueCount}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0 0 4px 0'
              }}>
                Vencidos
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Requieren atención
              </div>
            </div>
          </div>

          {/* Balance por Usuario */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0'
            }}>
              💰 Balance por Usuario
            </h4>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Usuario</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Pagado</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Recibido</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Pendiente</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.userBalances.map((userBalance) => (
                    <tr key={userBalance.userId} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    >
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {getUserName(userBalance.userId)}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        ${userBalance.paid}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        ${userBalance.received}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#f59e0b'
                      }}>
                        ${userBalance.pending}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        <span style={{
                          color: userBalance.netBalance >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          ${userBalance.netBalance >= 0 ? '+' : ''}${userBalance.netBalance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagos Pendientes */}
      {activeTab === 'pending' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              ⏳ Pagos Pendientes ({payments.filter(p => p.status === 'pending').length})
            </h4>
            <button
              onClick={loadAllData}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🔄 Actualizar
            </button>
          </div>
          
          <PaymentsList 
            payments={payments.filter(p => p.status === 'pending')}
            users={users}
            onMarkAsPaid={handleMarkAsPaid}
            onSendReminder={handleSendReminder}
            getUserName={getUserName}
          />
        </div>
      )}

      {/* Pagos Completados */}
      {activeTab === 'paid' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            ✅ Pagos Completados ({payments.filter(p => p.status === 'paid').length})
          </h4>
          
          <PaymentsList 
            payments={payments.filter(p => p.status === 'paid')}
            users={users}
            getUserName={getUserName}
            showPaidInfo={true}
          />
        </div>
      )}

      {/* Vista por Usuario */}
      {activeTab === 'users' && (
        <UserPaymentsView 
          users={users}
          payments={payments}
          getUserName={getUserName}
        />
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
function PaymentsList({ payments, users, onMarkAsPaid, onSendReminder, getUserName, showPaidInfo = false }) {
  if (payments.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '64px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>
          💰
        </div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          margin: 0
        }}>
          No hay pagos en esta categoría
        </p>
      </div>
    );
  }

  const handleQuickPay = (payment) => {
    const method = prompt('Método de pago (efectivo/transferencia/app):');
    if (method) {
      const notes = prompt('Notas adicionales (opcional):') || '';
      onMarkAsPaid(payment.id, method, notes);
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
                    {getUserName(payment.fromUser)} → {getUserName(payment.toUser)}
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
                    📅 Vence: {new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate).toLocaleDateString()}
                  </div>
                  {payment.notes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📝 {payment.notes}
                    </div>
                  )}
                  {showPaidInfo && payment.paidAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      ✅ Pagado: {payment.paidAt.toDate().toLocaleDateString()}
                    </div>
                  )}
                  {showPaidInfo && payment.paymentMethod && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💳 Método: {payment.paymentMethod}
                    </div>
                  )}
                </div>
              </div>
              
              {!showPaidInfo && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onSendReminder(payment.id)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    title="Enviar recordatorio"
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    📧 Recordar
                  </button>
                  <button
                    onClick={() => handleQuickPay(payment)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    title="Marcar como pagado"
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ✅ Confirmar Pago
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente para vista por usuario
function UserPaymentsView({ users, payments, getUserName }) {
  const userPayments = users.map(user => {
    const userPaymentsDue = payments.filter(p => p.fromUser === user.id);
    const userPaymentsToReceive = payments.filter(p => p.toUser === user.id);
    
    return {
      user,
      paymentsDue: userPaymentsDue,
      paymentsToReceive: userPaymentsToReceive,
      totalOwed: userPaymentsDue.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      totalToReceive: userPaymentsToReceive.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    };
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      {userPayments.map(userPayment => (
        <div key={userPayment.user.id} style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👤 {userPayment.user.name}
            </h4>
            <div style={{
              textAlign: 'right',
              fontSize: '14px'
            }}>
              <div style={{ color: '#ef4444', marginBottom: '4px' }}>
                Debe: ${userPayment.totalOwed}
              </div>
              <div style={{ color: '#10b981' }}>
                Recibe: ${userPayment.totalToReceive}
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {/* Pagos que debe hacer */}
            <div>
              <h5 style={{
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 12px 0'
              }}>
                💸 Debe Pagar ({userPayment.paymentsDue.filter(p => p.status === 'pending').length})
              </h5>
              {userPayment.paymentsDue.filter(p => p.status === 'pending').length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {userPayment.paymentsDue.filter(p => p.status === 'pending').map(payment => (
                    <div key={payment.id} style={{
                      fontSize: '14px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.4)'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        ${payment.amount} → {getUserName(payment.toUser)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        {payment.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontStyle: 'italic'
                }}>
                  ✅ Todo al día
                </div>
              )}
            </div>
            
            {/* Pagos que debe recibir */}
            <div>
              <h5 style={{
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 12px 0'
              }}>
                💰 Por Recibir ({userPayment.paymentsToReceive.filter(p => p.status === 'pending').length})
              </h5>
              {userPayment.paymentsToReceive.filter(p => p.status === 'pending').length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {userPayment.paymentsToReceive.filter(p => p.status === 'pending').map(payment => (
                    <div key={payment.id} style={{
                      fontSize: '14px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.4)'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        ${payment.amount} ← {getUserName(payment.fromUser)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        {payment.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontStyle: 'italic'
                }}>
                  📭 Nada pendiente
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}