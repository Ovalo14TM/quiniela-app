// src/components/admin/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/userService';
import MatchesManagement from './MatchesManagement';
import CreateQuiniela from './CreateQuiniela';
import ResultsManagement from './ResultsManagement';
import PaymentsManagement from './PaymentsManagement';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const usersData = await getAllUsers();
    setUsers(usersData);
    setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🔧 Panel de Administración
        </h2>
        
        {/* Tabs */}
        <div className="flex space-x-2">
          <TabButton
            tabId="results"
            label="📊 Resultados"
            isActive={activeTab === 'results'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="users"
            label="👥 Usuarios"
            isActive={activeTab === 'users'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="matches"
            label="⚽ Partidos"
            isActive={activeTab === 'matches'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="quinielas"
            label="🏆 Quinielas"
            isActive={activeTab === 'quinielas'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="payments"
            label="💰 Pagos"
            isActive={activeTab === 'payments'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Gestión de Usuarios
            </h3>
            <button
              onClick={loadUsers}
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rol</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Puntos</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ganancias</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{user.totalPoints || 0}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${user.totalWinnings || 0} MXN
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No hay usuarios registrados</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <ResultsManagement />
      )}

      {activeTab === 'matches' && (
        <MatchesManagement />
      )}

      {activeTab === 'quinielas' && (
        <CreateQuiniela onQuinielaCreated={() => console.log('Quiniela created!')} />
      )}

      {activeTab === 'payments' && (
        <PaymentsManagement />
      )}
    </div>
  );
}