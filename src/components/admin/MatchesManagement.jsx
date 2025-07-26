// src/components/admin/MatchesManagement.jsx - Versión con diseño mejorado
import React, { useState, useEffect } from 'react';
import { getAvailableMatches, formatMatchDate, formatMatchScore } from '../../services/footballService';
import { saveMultipleMatches, getAllAvailableMatches } from '../../services/matchesService';

export default function MatchesManagement() {
  const [apiMatches, setApiMatches] = useState([]);
  const [savedMatches, setSavedMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [activeTab, setActiveTab] = useState('api');

  useEffect(() => {
    loadSavedMatches();
  }, []);

  const loadApiMatches = async () => {
    setLoading(true);
    try {
      const matches = await getAvailableMatches();
      setApiMatches(matches);
    } catch (error) {
      console.error('Error loading API matches:', error);
    }
    setLoading(false);
  };

  const loadSavedMatches = async () => {
    try {
      const matches = await getAllAvailableMatches();
      setSavedMatches(matches);
    } catch (error) {
      console.error('Error loading saved matches:', error);
    }
  };

  const handleImportMatches = async () => {
    if (selectedMatches.size === 0) {
      alert('Selecciona al menos un partido para importar');
      return;
    }

    setImporting(true);
    try {
      const matchesToImport = apiMatches.filter(match => selectedMatches.has(match.id));
      const success = await saveMultipleMatches(matchesToImport);
      
      if (success) {
        alert(`${matchesToImport.length} partidos importados correctamente`);
        setSelectedMatches(new Set());
        loadSavedMatches();
      } else {
        alert('Error al importar partidos');
      }
    } catch (error) {
      console.error('Error importing matches:', error);
      alert('Error al importar partidos');
    }
    setImporting(false);
  };

  const toggleMatchSelection = (matchId) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(matchId)) {
      newSelected.delete(matchId);
    } else {
      newSelected.add(matchId);
    }
    setSelectedMatches(newSelected);
  };

  const selectAllMatches = () => {
    if (selectedMatches.size === apiMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(apiMatches.map(match => match.id)));
    }
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
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 8px 0'
            }}>
              ⚽ Gestión de Partidos
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0
            }}>
              Importa partidos desde APIs o añádelos manualmente
            </p>
          </div>
          
          <button
            onClick={loadApiMatches}
            disabled={loading}
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
              opacity: loading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Cargando...
              </>
            ) : (
              <>
                🔍 Buscar Partidos
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <TabButton
            tabId="api"
            label="Partidos de API"
            icon="📡"
            isActive={activeTab === 'api'}
            onClick={setActiveTab}
            badge={apiMatches.length}
          />
          <TabButton
            tabId="saved"
            label="Partidos Guardados"
            icon="💾"
            isActive={activeTab === 'saved'}
            onClick={setActiveTab}
            badge={savedMatches.length}
          />
          <TabButton
            tabId="manual"
            label="Agregar Manual"
            icon="✍️"
            isActive={activeTab === 'manual'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Partidos de API */}
      {activeTab === 'api' && (
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
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              📡 Partidos Disponibles ({apiMatches.length})
            </h4>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={selectAllMatches}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {selectedMatches.size === apiMatches.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </button>
              
              <button
                onClick={handleImportMatches}
                disabled={importing || selectedMatches.size === 0}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: (importing || selectedMatches.size === 0) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!importing && selectedMatches.size > 0) {
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!importing && selectedMatches.size > 0) {
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {importing ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Importando...
                  </>
                ) : (
                  <>
                    📥 Importar ({selectedMatches.size})
                  </>
                )}
              </button>
            </div>
          </div>

          {apiMatches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>
                📡
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                margin: '0 0 8px 0'
              }}>
                {loading ? 'Buscando partidos...' : 'No hay partidos cargados'}
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0
              }}>
                Haz clic en "Buscar Partidos" para cargar desde las APIs
              </p>
            </div>
          ) : (
            <MatchTable 
              matches={apiMatches}
              selectedMatches={selectedMatches}
              onToggleMatch={toggleMatchSelection}
              showSelection={true}
            />
          )}
        </div>
      )}

      {/* Partidos Guardados */}
      {activeTab === 'saved' && (
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
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              💾 Partidos Guardados ({savedMatches.length})
            </h4>
            
            <button
              onClick={loadSavedMatches}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              🔄 Actualizar
            </button>
          </div>

          {savedMatches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>
                📦
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                margin: '0 0 8px 0'
              }}>
                No hay partidos guardados
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0
              }}>
                Importa partidos desde APIs o añádelos manualmente
              </p>
            </div>
          ) : (
            <MatchTable 
              matches={savedMatches}
              showSelection={false}
              showActions={true}
            />
          )}
        </div>
      )}

      {/* Agregar Manual */}
      {activeTab === 'manual' && (
        <ManualMatchForm onMatchAdded={loadSavedMatches} />
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

// Componente para la tabla de partidos
function MatchTable({ matches, selectedMatches, onToggleMatch, showSelection, showActions }) {
  return (
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
            {showSelection && (
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <input
                  type="checkbox"
                  checked={selectedMatches?.size === matches.length && matches.length > 0}
                  onChange={() => {}}
                  style={{ transform: 'scale(1.2)' }}
                />
              </th>
            )}
            <th style={{
              padding: '16px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>Partido</th>
            <th style={{
              padding: '16px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>Liga</th>
            <th style={{
              padding: '16px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>Fecha</th>
            <th style={{
              padding: '16px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>Estado</th>
            {showActions && (
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr key={match.id} style={{
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
              {showSelection && (
                <td style={{ padding: '16px' }}>
                  <input
                    type="checkbox"
                    checked={selectedMatches?.has(match.id) || false}
                    onChange={() => onToggleMatch(match.id)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </td>
              )}
              <td style={{
                padding: '16px',
                color: 'white'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  {match.homeTeam} vs {match.awayTeam}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px'
                }}>
                  {formatMatchScore(match.homeScore, match.awayScore)}
                </div>
              </td>
              <td style={{
                padding: '16px',
                fontSize: '14px',
                color: 'white'
              }}>
                {match.league}
              </td>
              <td style={{
                padding: '16px',
                fontSize: '14px',
                color: 'white'
              }}>
                {formatMatchDate(match.date)}
              </td>
              <td style={{ padding: '16px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  background: match.status === 'FINISHED'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : match.status === 'LIVE'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)',
                  color: match.status === 'FINISHED' ? '#10b981' :
                         match.status === 'LIVE' ? '#f59e0b' : '#3b82f6',
                  border: `1px solid ${match.status === 'FINISHED' ? 'rgba(16, 185, 129, 0.4)' :
                                       match.status === 'LIVE' ? 'rgba(245, 158, 11, 0.4)' :
                                       'rgba(59, 130, 246, 0.4)'}`
                }}>
                  {match.status === 'FINISHED' ? '✅ Terminado' :
                   match.status === 'LIVE' ? '🟡 En Vivo' : '⏳ Programado'}
                </span>
              </td>
              {showActions && (
                <td style={{ padding: '16px' }}>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
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
                    ✏️ Editar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente para agregar partidos manualmente
function ManualMatchForm({ onMatchAdded }) {
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    league: '',
    date: '',
    time: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el partido manual
    console.log('Guardar partido manual:', formData);
    onMatchAdded();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h4 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'white',
        margin: '0 0 16px 0'
      }}>
        ✍️ Agregar Partido Manualmente
      </h4>
      
      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            🏠 Equipo Local
          </label>
          <input
            type="text"
            value={formData.homeTeam}
            onChange={(e) => handleChange('homeTeam', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            placeholder="Ej: Real Madrid"
            required
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            ✈️ Equipo Visitante
          </label>
          <input
            type="text"
            value={formData.awayTeam}
            onChange={(e) => handleChange('awayTeam', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            placeholder="Ej: FC Barcelona"
            required
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            🏆 Liga
          </label>
          <input
            type="text"
            value={formData.league}
            onChange={(e) => handleChange('league', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            placeholder="Ej: La Liga"
            required
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            📅 Fecha
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            required
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            ⏰ Hora
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            required
          />
        </div>

        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '16px'
        }}>
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
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
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ➕ Agregar Partido
          </button>
        </div>
      </form>
    </div>
  );
}