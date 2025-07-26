// src/components/admin/AdminPanel.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/userService';
import AdminPredictionsViewer from './AdminPredictionsViewer';  // ← NUEVA LÍNEA
import MatchesManagement from './MatchesManagement';
import CreateQuiniela from './CreateQuiniela';
import ResultsManagement from './ResultsManagement';
import PaymentsManagement from './PaymentsManagement';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const usersData = await getAllUsers();
    setUsers(usersData);
    setLoading(false);
  };

  const TabButton = ({ tabId, label, isActive, onClick, icon, badge }) => (
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
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span>{label}</span>
      {badge && (
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

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(15px)',
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
          🔧 Panel de Administración
        </h2>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <TabButton
            tabId="dashboard"
            label="Dashboard"
            icon="📊"
            isActive={activeTab === 'dashboard'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="users"
            label="Usuarios"
            icon="👥"
            isActive={activeTab === 'users'}
            onClick={setActiveTab}
            badge={users.length}
          />
          <TabButton
            tabId="matches"
            label="Partidos"
            icon="⚽"
            isActive={activeTab === 'matches'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="quinielas"
            label="Quinielas"
            icon="🏆"
            isActive={activeTab === 'quinielas'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="results"
            label="Resultados"
            icon="📋"
            isActive={activeTab === 'results'}
            onClick={setActiveTab}
          />
          <TabButton               // ← PEGAR AQUÍ
            tabId="predictions"
            label="Predicciones"
            icon="👀"
            isActive={activeTab === 'predictions'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="payments"
            label="Pagos"
            icon="💰"
            isActive={activeTab === 'payments'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          {/* Overview Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <StatCard
              title="Total Usuarios"
              value={users.length}
              subtitle="Registrados en el sistema"
              icon="👥"
              color="#3b82f6"
            />
            <StatCard
              title="Usuarios Activos"
              value={users.filter(u => u.isActive).length}
              subtitle="Con actividad reciente"
              icon="✅"
              color="#10b981"
            />
            <StatCard
              title="Administradores"
              value={users.filter(u => u.role === 'admin').length}
              subtitle="Con permisos de admin"
              icon="👑"
              color="#8b5cf6"
            />
            <StatCard
              title="Quinielas Activas"
              value="1"
              subtitle="En curso actualmente"
              icon="🏆"
              color="#f59e0b"
            />
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0'
            }}>
              ⚡ Acciones Rápidas
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {[
                { icon: '🏆', title: 'Nueva Quiniela', desc: 'Crear quiniela semanal', tab: 'quinielas' },
                { icon: '⚽', title: 'Importar Partidos', desc: 'Buscar desde APIs', tab: 'matches' },
                { icon: '📊', title: 'Ver Resultados', desc: 'Gestionar puntuaciones', tab: 'results' },
                { icon: '💰', title: 'Gestionar Pagos', desc: 'Administrar finanzas', tab: 'payments' }
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(action.tab)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '12px'
                  }}>
                    {action.icon}
                  </div>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginBottom: '4px'
                  }}>
                    {action.title}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    opacity: 0.8
                  }}>
                    {action.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0'
            }}>
              🔧 Estado del Sistema
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {[
                { label: 'Base de Datos', status: 'online', icon: '🗄️' },
                { label: 'APIs Deportivas', status: 'online', icon: '⚽' },
                { label: 'Autenticación', status: 'online', icon: '🔐' },
                { label: 'Notificaciones', status: 'maintenance', icon: '📧' }
              ].map((service, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{service.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      {service.label}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: service.status === 'online' 
                          ? '#10b981' 
                          : service.status === 'maintenance' 
                          ? '#f59e0b' 
                          : '#ef4444'
                      }}></div>
                      <span style={{
                        fontSize: '12px',
                        color: service.status === 'online' 
                          ? '#10b981' 
                          : service.status === 'maintenance' 
                          ? '#f59e0b' 
                          : '#ef4444'
                      }}>
                        {service.status === 'online' ? 'En línea' : 
                         service.status === 'maintenance' ? 'Mantenimiento' : 'Fuera de línea'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
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
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              Gestión de Usuarios
            </h3>
            <button
              onClick={loadUsers}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
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

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }}></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                Cargando usuarios...
              </p>
            </div>
          ) : (
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
                    {['Email', 'Nombre', 'Rol', 'Puntos', 'Ganancias', 'Estado'].map((header, index) => (
                      <th key={index} style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{
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
                        color: 'white'
                      }}>
                        {user.email}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {user.name}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '6px',
                          background: user.role === 'admin' 
                            ? 'rgba(139, 92, 246, 0.2)' 
                            : 'rgba(16, 185, 129, 0.2)',
                          color: user.role === 'admin' ? '#a855f7' : '#10b981',
                          border: `1px solid ${user.role === 'admin' 
                            ? 'rgba(139, 92, 246, 0.4)' 
                            : 'rgba(16, 185, 129, 0.4)'}`
                        }}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {user.totalPoints || 0}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: user.totalWinnings >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        ${user.totalWinnings || 0} MXN
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '6px',
                          background: user.isActive 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : 'rgba(239, 68, 68, 0.2)',
                          color: user.isActive ? '#10b981' : '#ef4444',
                          border: `1px solid ${user.isActive 
                            ? 'rgba(16, 185, 129, 0.4)' 
                            : 'rgba(239, 68, 68, 0.4)'}`
                        }}>
                          {user.isActive ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '64px'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>👥</div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
                    No hay usuarios registrados
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div style={{
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <ResultsManagement />
        </div>
      )}

      {activeTab === 'matches' && (
        <div style={{
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <MatchesManagement />
        </div>
      )}

      {activeTab === 'quinielas' && (
        <div style={{
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <CreateQuiniela onQuinielaCreated={() => console.log('Quiniela created!')} />
        </div>
      )}

{activeTab === 'predictions' && (
  <div style={{
    animation: 'fadeIn 0.6s ease-out'
  }}>
    <AdminPredictionsViewer />
  </div>
)}

      {activeTab === 'payments' && (
        <div style={{
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <PaymentsManagement />
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