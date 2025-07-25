// src/components/user/UserPayments.jsx
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
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando información de pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          💰 Mis Pagos
        </h2>
        
        <div className="flex flex-wrap gap-2">
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
        <div className="space-y-6">
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">💸 Debo Pagar</h3>
                <span className="text-2xl">😰</span>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  ${payments.totalOwed}
                </div>
                <div className="text-sm text-gray-600">
                  {payments.paymentsDue.filter(p => p.status === 'pending').length} pagos pendientes
                </div>
              </div>
              
              {payments.totalOwed > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-800">
                    💡 <strong>Tip:</strong> Paga pronto para evitar recordatorios
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">💰 Me Deben</h3>
                <span className="text-2xl">😊</span>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${payments.totalToReceive}
                </div>
                <div className="text-sm text-gray-600">
                  {payments.paymentsToReceive.filter(p => p.status === 'pending').length} pagos esperando
                </div>
              </div>
              
              {payments.totalToReceive > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    🎉 <strong>¡Genial!</strong> Tienes dinero por cobrar
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Balance General */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚖️ Balance General
            </h3>
            
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                payments.totalToReceive - payments.totalOwed >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                ${payments.totalToReceive - payments.totalOwed >= 0 ? '+' : ''}
                {payments.totalToReceive - payments.totalOwed}
              </div>
              <div className="text-sm text-gray-600">
                {payments.totalToReceive - payments.totalOwed >= 0 
                  ? '🎉 Estás en positivo' 
                  : '😅 Estás en negativo'
                }
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          {(payments.totalOwed > 0 || payments.totalToReceive > 0) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚡ Acciones Rápidas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payments.totalOwed > 0 && (
                  <button
                    onClick={() => setActiveTab('owed')}
                    className="bg-red-100 hover:bg-red-200 text-red-700 p-4 rounded-lg text-left transition-colors"
                  >
                    <div className="font-medium">💸 Ver Pagos Pendientes</div>
                    <div className="text-sm">Revisa qué debes pagar</div>
                  </button>
                )}
                
                {payments.totalToReceive > 0 && (
                  <button
                    onClick={() => setActiveTab('receiving')}
                    className="bg-green-100 hover:bg-green-200 text-green-700 p-4 rounded-lg text-left transition-colors"
                  >
                    <div className="font-medium">💰 Ver Dinero por Cobrar</div>
                    <div className="text-sm">Revisa quién te debe</div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagos que Debo */}
      {activeTab === 'owed' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💸 Pagos Pendientes
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💰 Dinero por Cobrar
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📚 Historial de Pagos
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">✅ Pagos Completados</h4>
              <PaymentsList 
                payments={[...payments.paymentsDue, ...payments.paymentsToReceive].filter(p => p.status === 'paid')}
                getUserName={getUserName}
                type="history"
              />
            </div>
          </div>
        </div>
      )}
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
      <div className="text-center py-8">
        <div className="text-4xl mb-4">{message.icon}</div>
        <p className="text-gray-600">{message.text}</p>
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
    <div className="space-y-4">
      {payments.map((payment) => {
        const isOverdue = payment.status === 'pending' && 
          new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate) < new Date();
        
        return (
          <div 
            key={payment.id} 
            className={`border rounded-lg p-4 ${
              isOverdue ? 'border-red-200 bg-red-50' : 
              type === 'receiving' ? 'border-green-200 bg-green-50' :
              'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {type === 'owed' 
                      ? `Pagas a ${getUserName(payment.toUser)}`
                      : `${getUserName(payment.fromUser)} te paga`
                    }
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ${payment.amount}
                  </span>
                  {isOverdue && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      ⚠️ Vencido
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📋 {payment.reason}</div>
                  <div>📅 {new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate).toLocaleDateString()}</div>
                  {payment.notes && <div>📝 {payment.notes}</div>}
                  {payment.paidAt && (
                    <div>✅ Pagado: {payment.paidAt.toDate().toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              
              {type === 'owed' && payment.status === 'pending' && (
                <button
                  onClick={() => handleQuickPay(payment)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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