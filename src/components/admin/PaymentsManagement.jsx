// src/components/admin/PaymentsManagement.jsx
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

  const TabButton = ({ tabId, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando datos financieros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💰 Gestión de Pagos
        </h3>
        
        <div className="flex flex-wrap gap-2">
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
          />
          <TabButton
            tabId="paid"
            label="✅ Pagados"
            isActive={activeTab === 'paid'}
            onClick={setActiveTab}
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
        <div className="space-y-6">
          {/* Métricas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  ${summary.totalAmount}
                </div>
                <div className="text-sm text-gray-600">Total Movido</div>
                <div className="text-xs text-gray-500">
                  {summary.totalTransactions} transacciones
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  ${summary.pendingAmount}
                </div>
                <div className="text-sm text-gray-600">Pendiente</div>
                <div className="text-xs text-gray-500">
                  {summary.pendingCount} pagos
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${summary.paidAmount}
                </div>
                <div className="text-sm text-gray-600">Pagado</div>
                <div className="text-xs text-gray-500">
                  {summary.paidCount} completados
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {summary.overdueCount}
                </div>
                <div className="text-sm text-gray-600">Vencidos</div>
                <div className="text-xs text-gray-500">
                  Requieren atención
                </div>
              </div>
            </div>
          </div>

          {/* Balance por Usuario */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              💰 Balance por Usuario
            </h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Usuario</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Pagado</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Recibido</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Pendiente</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.userBalances.map((userBalance) => (
                    <tr key={userBalance.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {getUserName(userBalance.userId)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${userBalance.paid}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${userBalance.received}
                      </td>
                      <td className="px-4 py-2 text-sm text-orange-600">
                        ${userBalance.pending}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        <span className={userBalance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              ⏳ Pagos Pendientes ({payments.filter(p => p.status === 'pending').length})
            </h4>
            <button
              onClick={loadAllData}
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg"
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
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
    </div>
  );
}

// Componente para lista de pagos
function PaymentsList({ payments, users, onMarkAsPaid, onSendReminder, getUserName, showPaidInfo = false }) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💰</div>
        <p className="text-gray-600">No hay pagos en esta categoría</p>
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
    <div className="space-y-4">
      {payments.map((payment) => {
        const isOverdue = payment.status === 'pending' && 
          new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate) < new Date();
        
        return (
          <div 
            key={payment.id} 
            className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {getUserName(payment.fromUser)} → {getUserName(payment.toUser)}
                  </span>
                  <span className="text-lg font-bold text-green-600">
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
                  <div>📅 Vence: {new Date(payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate).toLocaleDateString()}</div>
                  {payment.notes && <div>📝 {payment.notes}</div>}
                  {showPaidInfo && payment.paidAt && (
                    <div>✅ Pagado: {payment.paidAt.toDate().toLocaleDateString()}</div>
                  )}
                  {showPaidInfo && payment.paymentMethod && (
                    <div>💳 Método: {payment.paymentMethod}</div>
                  )}
                </div>
              </div>
              
              {!showPaidInfo && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onSendReminder(payment.id)}
                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                    title="Enviar recordatorio"
                  >
                    📧
                  </button>
                  <button
                    onClick={() => handleQuickPay(payment)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                    title="Marcar como pagado"
                  >
                    ✅ Pagar
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
    <div className="space-y-6">
      {userPayments.map(userPayment => (
        <div key={userPayment.user.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              👤 {userPayment.user.name}
            </h4>
            <div className="text-right text-sm">
              <div className="text-red-600">Debe: ${userPayment.totalOwed}</div>
              <div className="text-green-600">Recibe: ${userPayment.totalToReceive}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pagos que debe hacer */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">
                💸 Debe Pagar ({userPayment.paymentsDue.filter(p => p.status === 'pending').length})
              </h5>
              {userPayment.paymentsDue.filter(p => p.status === 'pending').length > 0 ? (
                <div className="space-y-2">
                  {userPayment.paymentsDue.filter(p => p.status === 'pending').map(payment => (
                    <div key={payment.id} className="text-sm bg-red-50 p-2 rounded">
                      ${payment.amount} → {getUserName(payment.toUser)}
                      <div className="text-xs text-gray-600">{payment.reason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">✅ Todo al día</div>
              )}
            </div>
            
            {/* Pagos que debe recibir */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">
                💰 Por Recibir ({userPayment.paymentsToReceive.filter(p => p.status === 'pending').length})
              </h5>
              {userPayment.paymentsToReceive.filter(p => p.status === 'pending').length > 0 ? (
                <div className="space-y-2">
                  {userPayment.paymentsToReceive.filter(p => p.status === 'pending').map(payment => (
                    <div key={payment.id} className="text-sm bg-green-50 p-2 rounded">
                      ${payment.amount} ← {getUserName(payment.fromUser)}
                      <div className="text-xs text-gray-600">{payment.reason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">📭 Nada pendiente</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}