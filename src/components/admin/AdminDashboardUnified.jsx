// src/components/admin/AdminDashboardUnified.jsx - Dashboard completo integrado

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkApiAvailability } from '../../services/weeklyMatchesService';
import { debugConfig, clearCache } from '../../config/apiConfig';

// Importar componentes existentes y nuevos
import WeeklyQuinielaCreator from './WeeklyQuinielaCreator';
import MatchesManagement from './MatchesManagement'; // Tu componente existente
import ResultsManagement from './ResultsManagement'; // Tu componente existente
import AdminPredictionsViewer from './AdminPredictionsViewer'; // Tu componente existente

export default function AdminDashboardUnified() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      // Verificar estado de APIs
      const apiStatus = await checkApiAvailability();
      
      // Verificar configuración del sistema
      const configStatus = debugConfig();
      
      setSystemStatus({
        api: apiStatus,
        config: configStatus,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error checking system status:', error);
    }
    setLoading(false);
  };

  const handleClearCache = () => {
    clearCache();
    alert('✅ Caché limpiado exitosamente');
  };

  const tabs = [
    { 
      id: 'overview', 
      label: '📊 Resumen', 
      icon: '📊',
      description: 'Estado del sistema y estadísticas generales'
    },
    { 
      id: 'auto-quiniela', 
      label: '🤖 Quiniela Automática', 
      icon: '🤖',
      description: 'Crear quinielas con partidos de APIs'
    },
    { 
      id: 'manual-matches', 
      label: '➕ Partidos Manuales', 
      icon: '➕',
      description: 'Agregar partidos individuales'
    },
    { 
      id: 'predictions', 
      label: '👥 Predicciones', 
      icon: '👥',
      description: 'Ver todas las predicciones de usuarios'
    },
    { 
      id: 'results', 
      label: '🏆 Resultados', 
      icon: '🏆',
      description: 'Capturar resultados y calcular puntos'
    },
    { 
      id: 'settings', 
      label: '⚙️ Configuración', 
      icon: '⚙️',
      description: 'Configuración del sistema'
    }
  ];

  const renderOverview = () => (
    <div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: 'white',
        margin: '0 0 24px 0'
      }}>
        📊 Resumen del Sistema
      </h2>

      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '16px'
          }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Verificando estado del sistema...
          </span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Estado de APIs */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🌐 Estado de APIs
            </h3>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: systemStatus?.api?.available 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: `1px solid ${systemStatus?.api?.available 
                ? 'rgba(34, 197, 94, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              <span style={{ fontSize: '24px' }}>
                {systemStatus?.api?.available ? '✅' : '❌'}
              </span>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: systemStatus?.api?.available ? '#22c55e' : '#ef4444'
                }}>
                  {systemStatus?.api?.available ? 'API Conectada' : 'API Desconectada'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: '2px'
                }}>
                  {systemStatus?.api?.available 
                    ? `${systemStatus.api.requestsRemaining || '?'} requests restantes`
                    : systemStatus?.api?.reason || 'Sin conexión'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Configuración del Sistema */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚙️ Configuración
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#3b82f6'
                }}>
                  {systemStatus?.config?.leagues || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Ligas
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  {systemStatus?.config?.teamsWithAliases || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Equipos
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🚀 Acciones Rápidas
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                onClick={() => setActiveTab('auto-quiniela')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                🤖 Crear Quiniela Automática
              </button>
              
              <button
                onClick={checkSystemStatus}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 Verificar Sistema
              </button>
              
              <button
                onClick={handleClearCache}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                🗑️ Limpiar Caché
              </button>
            </div>
          </div>

          {/* Estado del Sistema Detallado */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 Diagnóstico Detallado
            </h3>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <div>🔧 <strong>Configuración del Sistema:</strong></div>
              <div>├─ Ligas configuradas: {systemStatus?.config?.leagues || 0}</div>
              <div>├─ API disponible: {systemStatus?.api?.available ? '✅' : '❌'}</div>
              <div>├─ Caché habilitado: {systemStatus?.config?.cacheEnabled ? '✅' : '❌'}</div>
              <div>└─ Equipos con alias: {systemStatus?.config?.teamsWithAliases || 0}</div>
              <br />
              <div>📊 <strong>Estado de APIs:</strong></div>
              <div>├─ Requests restantes: {systemStatus?.api?.requestsRemaining || 'N/A'}</div>
              <div>├─ Total de requests: {systemStatus?.api?.requestsTotal || 'N/A'}</div>
              <div>└─ Última verificación: {systemStatus?.timestamp?.toLocaleTimeString('es-MX') || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: 'white',
        margin: '0 0 24px 0'
      }}>
        ⚙️ Configuración del Sistema
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Configuración de APIs */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            🌐 Configuración de APIs
          </h3>
          
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6'
          }}>
            <p><strong>API Key Status:</strong> {systemStatus?.api?.available ? '✅ Configurada' : '❌ No configurada'}</p>
            <p><strong>Endpoint:</strong> https://v3.football.api-sports.io</p>
            <p><strong>Requests disponibles:</strong> {systemStatus?.api?.requestsRemaining || 'N/A'}</p>
            
            {!systemStatus?.api?.available && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px'
              }}>
                <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>
                  ⚠️ API Key no configurada
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', marginTop: '4px' }}>
                  Agrega VITE_API_SPORTS_KEY a tu archivo .env
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gestión de Caché */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            💾 Gestión de Caché
          </h3>
          
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '16px'
          }}>
            <p>El caché mejora el rendimiento almacenando estadísticas temporalmente.</p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={handleClearCache}
              style={{
                padding: '12px 16px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🗑️ Limpiar Caché
            </button>
            
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Esto eliminará todas las estadísticas guardadas
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            📋 Información del Sistema
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>LIGAS CONFIGURADAS</div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>8 Ligas</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
                Liga MX, Premier, La Liga, Serie A, Bundesliga, Ligue 1, Champions, Leagues Cup
              </div>
            </div>
            
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>EQUIPOS CON DATOS</div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                {systemStatus?.config?.teamsWithAliases || 0}+ Equipos
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
                Con alias y datos de muestra
              </div>
            </div>
            
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>MODO DE FUNCIONAMIENTO</div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                {systemStatus?.api?.available ? 'API + Respaldo' : 'Solo Datos Locales'}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
                {systemStatus?.api?.available ? 'Datos reales con respaldo' : 'Datos de muestra únicamente'}
              </div>
            </div>
            
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>ÚLTIMA ACTUALIZACIÓN</div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                {systemStatus?.timestamp?.toLocaleTimeString('es-MX') || 'N/A'}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
                Estado del sistema
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 8px 0'
        }}>
          🎯 Panel de Administración
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '0 0 16px 0',
          fontSize: '16px'
        }}>
          Gestiona quinielas automáticas, partidos y configuración del sistema
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <span>👤 {currentUser?.email}</span>
          <span>•</span>
          <span>🕐 {new Date().toLocaleString('es-MX')}</span>
          <span>•</span>
          <span style={{
            color: systemStatus?.api?.available ? '#22c55e' : '#ef4444'
          }}>
            {systemStatus?.api?.available ? '🟢 API Conectada' : '🔴 Sin API'}
          </span>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '4px',
        borderRadius: '12px',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1',
              minWidth: '140px',
              padding: '12px 16px',
              background: activeTab === tab.id 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
            title={tab.description}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>
              {tab.icon}
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.2' }}>
              {tab.label.replace(/^[^a-zA-Z]*/, '')} {/* Quitar emoji del texto */}
            </div>
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'auto-quiniela' && <WeeklyQuinielaCreator />}
        {activeTab === 'manual-matches' && <MatchesManagement />}
        {activeTab === 'predictions' && <AdminPredictionsViewer />}
        {activeTab === 'results' && <ResultsManagement />}
        {activeTab === 'settings' && renderSettings()}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsive tabs */
        @media (max-width: 768px) {
          .tab-navigation {
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}