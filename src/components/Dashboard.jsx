// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../hooks/useUser';
import AdminPanel from './admin/AdminPanel';
import PredictionsForm from './user/PredictionsForm';
import Rankings from './Rankings';
import UserPayments from './user/UserPayments';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { userProfile, isAdmin, loading } = useUser();
  const [currentView, setCurrentView] = useState('home');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const NavButton = ({ viewId, label, icon, onClick, isActive }) => (
    <button
      onClick={() => onClick(viewId)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                🏆 Quiniela Primos
              </h1>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-2">
                <NavButton
              viewId="payments"
              label="Pagos"
              icon="💰"
              onClick={setCurrentView}
              isActive={currentView === 'payments'}
            />
            <NavButton
                  viewId="payments"
                  label="Pagos"
                  icon="💰"
                  onClick={setCurrentView}
                  isActive={currentView === 'payments'}
                />
                <NavButton
                  viewId="home"
                  label="Inicio"
                  icon="🏠"
                  onClick={setCurrentView}
                  isActive={currentView === 'home'}
                />
                {isAdmin && (
                  <NavButton
                    viewId="admin"
                    label="Admin"
                    icon="🔧"
                    onClick={setCurrentView}
                    isActive={currentView === 'admin'}
                  />
                )}
                <NavButton
                  viewId="rankings"
                  label="Rankings"
                  icon="🏆"
                  onClick={setCurrentView}
                  isActive={currentView === 'rankings'}
                />
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.name || currentUser?.email.split('@')[0]}
                </div>
                <div className="text-xs text-gray-600">
                  {userProfile?.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex space-x-2 overflow-x-auto">
            <NavButton
              viewId="home"
              label="Inicio"
              icon="🏠"
              onClick={setCurrentView}
              isActive={currentView === 'home'}
            />
            {isAdmin && (
              <NavButton
                viewId="admin"
                label="Admin"
                icon="🔧"
                onClick={setCurrentView}
                isActive={currentView === 'admin'}
              />
            )}
            <NavButton
              viewId="rankings"
              label="Rankings"
              icon="🏆"
              onClick={setCurrentView}
              isActive={currentView === 'rankings'}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Home View */}
        {currentView === 'home' && (
          <>
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Bienvenido {userProfile?.name}! 🎯
                </h2>
                <p className="text-gray-600 mb-4">
                  {isAdmin 
                    ? 'Panel de administrador - Gestiona quinielas y usuarios' 
                    : 'Sistema de apuestas entre primos'}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    ✅ Sistema de usuarios y roles funcionando<br/>
                    ✅ Perfiles de usuario creados automáticamente<br/>
                    {isAdmin && '✅ Panel de administración disponible'}<br/>
                    🚧 Próximo: Sistema de partidos y quinielas
                  </p>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {userProfile?.totalPoints || 0}
                  </div>
                  <div className="text-sm text-gray-600">Puntos Totales</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${userProfile?.totalWinnings || 0}
                  </div>
                  <div className="text-sm text-gray-600">Ganancias (MXN)</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {userProfile?.quinielasWon || 0}
                  </div>
                  <div className="text-sm text-gray-600">Quinielas Ganadas</div>
                </div>
              </div>
            </div>

            {/* Current Week Section */}
            <PredictionsForm />
          </>
        )}

        {/* Admin View */}
        {currentView === 'admin' && isAdmin && (
          <AdminPanel />
        )}

        {/* Payments View */}
        {currentView === 'payments' && (
          <UserPayments />
        )}

        {/* Rankings View */}
        {currentView === 'rankings' && (
          <Rankings />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>🚀 Quiniela App v0.2 - Sistema de usuarios funcionando</p>
            <p className="mt-1">
              Usuario: <span className="font-medium">{userProfile?.name}</span> 
              {userProfile?.role === 'admin' && <span className="text-purple-600"> (Administrador)</span>}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}