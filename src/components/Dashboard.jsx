// src/components/Dashboard.jsx - Versión con diseño mejorado
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)'
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
          <p style={{ color: 'white', fontSize: '18px', margin: 0 }}>
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  const NavButton = ({ viewId, label, icon, onClick, isActive, badge }) => (
    <button
      onClick={() => onClick(viewId)}
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
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{label}</span>
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

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
    }}
    >
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60px',
        height: '60px',
        background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
        borderRadius: '0 16px 0 100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{ fontSize: '24px', filter: 'brightness(1.2)' }}>{icon}</span>
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '14px',
          fontWeight: '500',
          margin: '0 0 8px 0'
        }}>
          {title}
        </p>
        <h3 style={{
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 0 4px 0',
          lineHeight: 1
        }}>
          {value}
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          margin: 0
        }}>
          {subtitle}
        </p>
        {trend && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ 
              fontSize: '12px',
              color: trend > 0 ? '#10b981' : '#ef4444'
            }}>
              {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <div style={{
          position: 'absolute',
          top: '-200px',
          right: '-200px',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          animation: 'pulse 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '50%',
          animation: 'pulse 8s ease-in-out infinite'
        }}></div>
      </div>

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '80px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🏆
              </div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                Quiniela Primos
              </h1>
              
              {/* Desktop Navigation */}
              <nav style={{
                display: 'flex',
                gap: '8px',
                marginLeft: '32px'
              }}>
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
                <NavButton
                  viewId="payments"
                  label="Pagos"
                  icon="💰"
                  onClick={setCurrentView}
                  isActive={currentView === 'payments'}
                  badge={0} // Aquí puedes pasar el número de pagos pendientes
                />
              </nav>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  margin: '0 0 2px 0'
                }}>
                  {userProfile?.name || currentUser?.email.split('@')[0]}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0
                }}>
                  {userProfile?.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fca5a5',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.color = '#fca5a5';
                }}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        position: 'relative',
        zIndex: 5,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Home View */}
        {currentView === 'home' && (
          <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            {/* Welcome Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '32px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                margin: '0 auto 20px',
                animation: 'bounce 2s ease-in-out infinite'
              }}>
                🎯
              </div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 12px 0'
              }}>
                ¡Bienvenido {userProfile?.name}!
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '18px',
                margin: '0 0 24px 0'
              }}>
                {isAdmin 
                  ? 'Panel de administrador - Gestiona quinielas y usuarios' 
                  : 'Sistema de apuestas entre primos'
                }
              </p>
            </div>

            {/* User Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard
                title="Puntos Totales"
                value={userProfile?.totalPoints || 0}
                subtitle="Acumulados en todas las quinielas"
                icon="🎯"
                color="#3b82f6"
                trend={5}
              />
              <StatCard
                title="Ganancias"
                value={`$${userProfile?.totalWinnings || 0}`}
                subtitle="MXN ganados"
                icon="💰"
                color="#10b981"
                trend={-2}
              />
              <StatCard
                title="Quinielas Ganadas"
                value={userProfile?.quinielasWon || 0}
                subtitle="Victorias conseguidas"
                icon="🏆"
                color="#f59e0b"
                trend={0}
              />
            </div>

            {/* Current Week Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <PredictionsForm />
            </div>
          </div>
        )}

        {/* Admin View */}
        {currentView === 'admin' && isAdmin && (
          <div style={{
            animation: 'slideIn 0.5s ease-out',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <AdminPanel />
          </div>
        )}

        {/* Payments View */}
        {currentView === 'payments' && (
          <div style={{
            animation: 'slideIn 0.5s ease-out',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <UserPayments />
          </div>
        )}

        {/* Rankings View */}
        {currentView === 'rankings' && (
          <div style={{
            animation: 'slideIn 0.5s ease-out',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Rankings />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            margin: '0 0 8px 0'
          }}>
            🚀 Quiniela App v0.2 - Sistema de usuarios funcionando
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            margin: 0
          }}>
            Usuario: <span style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>
              {userProfile?.name}
            </span> 
            {userProfile?.role === 'admin' && (
              <span style={{ color: '#a855f7' }}> (Administrador)</span>
            )}
          </p>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}