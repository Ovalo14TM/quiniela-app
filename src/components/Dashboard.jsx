// src/components/Dashboard.jsx - Con historial y estadísticas habilitadas
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../hooks/useUser';
import PredictionsForm from './user/PredictionsForm';
import UserPayments from './user/UserPayments';
import BasicStats from './user/BasicStats'; // ✅ Importar stats
import Rankings from './Rankings'; // ✅ Importar rankings
import AdminPanel from './admin/AdminPanel';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { userProfile, isAdmin, loading } = useUser();
  const [activeView, setActiveView] = useState('predictions');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '16px', margin: 0 }}>
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: 'predictions',
      label: 'Quiniela Actual',
      icon: '🏆',
      description: 'Hacer predicciones',
      available: true
    },
    {
      id: 'payments',
      label: 'Mis Pagos',
      icon: '💰',
      description: 'Ver deudas y ganancias',
      available: true
    },
    {
      id: 'history',
      label: 'Historial',
      icon: '📋',
      description: 'Quinielas pasadas',
      available: true // ✅ HABILITADO
    },
    {
      id: 'stats',
      label: 'Estadísticas',
      icon: '📊',
      description: 'Mi rendimiento',
      available: true // ✅ HABILITADO
    },
    {
      id: 'rankings',
      label: 'Rankings',
      icon: '🏅',
      description: 'Ranking global',
      available: true // ✅ NUEVO
    }
  ];

  const adminItems = [
    {
      id: 'admin',
      label: 'Administración',
      icon: '🔧',
      description: 'Panel de admin',
      available: true
    }
  ];

  const NavButton = ({ item, isActive, onClick }) => (
    <button
      onClick={() => onClick(item.id)}
      disabled={!item.available}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '16px',
        background: isActive 
          ? 'rgba(255, 255, 255, 0.2)' 
          : item.available 
          ? 'transparent' 
          : 'rgba(255, 255, 255, 0.05)',
        border: 'none',
        borderRadius: '12px',
        color: item.available ? 'white' : 'rgba(255, 255, 255, 0.4)',
        cursor: item.available ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s ease',
        textAlign: 'left',
        fontSize: '16px',
        marginBottom: '8px'
      }}
      onMouseEnter={(e) => {
        if (item.available && !isActive) {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={(e) => {
        if (item.available && !isActive) {
          e.target.style.background = 'transparent';
          e.target.style.transform = 'translateX(0)';
        }
      }}
    >
      <span style={{ fontSize: '24px' }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
          {item.label}
        </div>
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.8,
          color: item.available ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)'
        }}>
          {item.available ? item.description : 'Próximamente'}
        </div>
      </div>
      {!item.available && (
        <span style={{ 
          fontSize: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          🔒
        </span>
      )}
    </button>
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: window.innerWidth < 768 ? (sidebarOpen ? '280px' : '0') : '280px',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        height: '100vh',
        zIndex: 1000
      }}>
        <div style={{ padding: '24px' }}>
          {/* Header del Sidebar */}
          <div style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🏆
              </div>
              <div>
                <h2 style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Quiniela Primos
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  margin: 0
                }}>
                  {userProfile?.name || 'Usuario'}
                  {isAdmin && (
                    <span style={{
                      marginLeft: '8px',
                      background: 'rgba(139, 92, 246, 0.3)',
                      color: '#a855f7',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      ADMIN
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Navegación Principal */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📱 Principal
            </h3>
            {navigationItems.map(item => (
              <NavButton
                key={item.id}
                item={item}
                isActive={activeView === item.id}
                onClick={setActiveView}
              />
            ))}
          </div>

          {/* Navegación Admin */}
          {isAdmin && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                👑 Administración
              </h3>
              {adminItems.map(item => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={activeView === item.id}
                  onClick={setActiveView}
                />
              ))}
            </div>
          )}

          {/* Usuario y Logout */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                📧 {currentUser.email}
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px'
              }}>
                🏆 {userProfile?.totalPoints || 0} puntos • 💰 ${userProfile?.totalWinnings || 0}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#fca5a5',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        padding: '24px',
        overflow: 'auto'
      }}>
        {/* Mobile Header */}
        {window.innerWidth < 768 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0
            }}>
              Quiniela Primos
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ☰
            </button>
          </div>
        )}

        {/* Content Area */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* ✅ SECCIONES PRINCIPALES */}
          {activeView === 'predictions' && <PredictionsForm />}
          {activeView === 'payments' && <UserPayments />}
          
          {/* ✅ HISTORIAL Y ESTADÍSTICAS HABILITADAS */}
          {activeView === 'history' && <BasicStats />}
          {activeView === 'stats' && <BasicStats />}
          {activeView === 'rankings' && <Rankings />}
          
          {/* ✅ ADMIN */}
          {activeView === 'admin' && isAdmin && <AdminPanel />}
        </div>
      </div>

      {/* Mobile Overlay */}
      {window.innerWidth < 768 && sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}