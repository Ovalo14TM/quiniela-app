// src/components/admin/WeeklyQuinielaCreator.jsx - Versión corregida para tu proyecto

import React, { useState, useEffect } from 'react';
import { 
  getWeeklyMatches, 
  getAvailableWeeks, 
  groupMatchesByLeague, 
  checkApiAvailability 
} from '../../services/weeklyMatchesService';
import { saveMatch } from '../../services/matchesService';
import { createWeeklyQuiniela } from '../../services/quinielaService'; // Función correcta
import { useAuth } from '../../context/AuthContext';

export default function WeeklyQuinielaCreator() {
  const { currentUser } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [groupedMatches, setGroupedMatches] = useState({});
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('select'); // 'select', 'preview', 'create'

  useEffect(() => {
    const weeks = getAvailableWeeks();
    setAvailableWeeks(weeks);
    
    checkApiStatus();
  }, []);

  useEffect(() => {
    if (selectedWeek !== null) {
      loadWeeklyMatches();
    }
  }, [selectedWeek]);

  const checkApiStatus = async () => {
    const status = await checkApiAvailability();
    setApiStatus(status);
  };

  const loadWeeklyMatches = async () => {
    setLoading(true);
    try {
      console.log(`🔄 Cargando partidos para semana ${selectedWeek}`);
      const weeklyMatches = await getWeeklyMatches(selectedWeek);
      setMatches(weeklyMatches);
      
      const grouped = groupMatchesByLeague(weeklyMatches);
      setGroupedMatches(grouped);
      
      console.log(`✅ ${weeklyMatches.length} partidos cargados`);
    } catch (error) {
      console.error('Error loading weekly matches:', error);
    }
    setLoading(false);
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

  const selectAllFromLeague = (league) => {
    const leagueMatches = groupedMatches[league] || [];
    const newSelected = new Set(selectedMatches);
    
    leagueMatches.forEach(match => {
      newSelected.add(match.id);
    });
    
    setSelectedMatches(newSelected);
  };

  const clearLeagueSelection = (league) => {
    const leagueMatches = groupedMatches[league] || [];
    const newSelected = new Set(selectedMatches);
    
    leagueMatches.forEach(match => {
      newSelected.delete(match.id);
    });
    
    setSelectedMatches(newSelected);
  };

  const createQuinielaFromSelection = async () => {
    if (selectedMatches.size === 0) {
      alert('Por favor selecciona al menos un partido');
      return;
    }

    setCreating(true);
    try {
      // 1. Guardar partidos seleccionados en Firestore
      const selectedMatchData = matches.filter(match => selectedMatches.has(match.id));
      const savedMatchIds = [];

      console.log(`💾 Guardando ${selectedMatchData.length} partidos...`);

      for (const match of selectedMatchData) {
        const matchData = {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: match.date,
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          source: 'api-weekly',
          apiId: match.apiId,
          leagueId: match.leagueId,
          venue: match.venue,
          round: match.round,
          createdBy: currentUser.uid,
          createdAt: new Date()
        };

        await saveMatch(matchData);
        savedMatchIds.push(match.id);
      }

      // 2. Crear la quiniela
      const selectedWeekData = availableWeeks[selectedWeek];
      const firstMatch = selectedMatchData.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      const lastMatch = selectedMatchData.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      // Deadline: 30 minutos antes del primer partido
      const deadline = new Date(firstMatch.date.getTime() - (30 * 60 * 1000));

      const quinielaData = {
        weekNumber: selectedWeek + 1,
        year: new Date().getFullYear(),
        title: `Quiniela Semanal - ${selectedWeekData.label}`,
        matches: savedMatchIds,
        deadline,
        firstMatchDate: firstMatch.date,
        lastMatchDate: lastMatch.date,
        createdBy: currentUser.uid
      };

      const quinielaRef = await createWeeklyQuiniela(quinielaData);
      const quinielaId = quinielaRef.id;

      alert(`✅ Quiniela creada exitosamente con ${selectedMatchData.length} partidos!`);
      
      // Reset
      setSelectedMatches(new Set());
      setActiveTab('select');
      
      console.log(`🎉 Quiniela ${quinielaId} creada con éxito`);

    } catch (error) {
      console.error('Error creating quiniela:', error);
      alert('❌ Error al crear la quiniela');
    }
    setCreating(false);
  };

  const formatMatchTime = (date) => {
    return new Date(date).toLocaleString('es-MX', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedMatchesData = () => {
    return matches.filter(match => selectedMatches.has(match.id));
  };

  if (loading && matches.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}></div>
        <h3 style={{
          color: 'white',
          fontSize: '24px',
          margin: '0 0 12px 0'
        }}>
          Cargando partidos desde la API...
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px',
          margin: 0
        }}>
          Consultando todas las ligas configuradas
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header con estado de API */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0
          }}>
            🏆 Creador de Quinielas Semanales
          </h2>
          
          {apiStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: apiStatus.available 
                ? 'rgba(34, 197, 94, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${apiStatus.available 
                ? 'rgba(34, 197, 94, 0.4)' 
                : 'rgba(239, 68, 68, 0.4)'}`
            }}>
              <span style={{
                fontSize: '20px'
              }}>
                {apiStatus.available ? '✅' : '❌'}
              </span>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: apiStatus.available ? '#22c55e' : '#ef4444'
                }}>
                  {apiStatus.available ? 'API Conectada' : 'API Desconectada'}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  {apiStatus.available 
                    ? `${apiStatus.requestsRemaining || '?'} requests restantes`
                    : apiStatus.reason
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0,
          fontSize: '16px'
        }}>
          Selecciona partidos de las principales ligas para crear tu quiniela semanal automáticamente
        </p>
      </div>

      {/* Navegación por pestañas */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '4px',
        borderRadius: '12px'
      }}>
        {[
          { id: 'select', label: `📋 Seleccionar (${selectedMatches.size})`, icon: '📋' },
          { id: 'preview', label: '👀 Vista Previa', icon: '👀' },
          { id: 'create', label: '🎯 Crear Quiniela', icon: '🎯' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab.id 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selector de semana */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: 'white',
          fontSize: '18px',
          margin: '0 0 16px 0'
        }}>
          📅 Seleccionar Semana
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px'
        }}>
          {availableWeeks.map((week, index) => (
            <button
              key={index}
              onClick={() => setSelectedWeek(index)}
              style={{
                padding: '16px',
                background: selectedWeek === index 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: selectedWeek === index 
                  ? '2px solid #60a5fa' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {week.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                {week.dateRange}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'select' && (
        <div>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              Actualizando partidos...
            </div>
          ) : (
            <div>
              {Object.keys(groupedMatches).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '80px', marginBottom: '24px' }}>⚽</div>
                  <h3 style={{
                    color: 'white',
                    fontSize: '24px',
                    margin: '0 0 12px 0'
                  }}>
                    No hay partidos disponibles
                  </h3>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '16px',
                    margin: 0
                  }}>
                    Intenta seleccionar otra semana o verifica la conexión a la API
                  </p>
                </div>
              ) : (
                Object.entries(groupedMatches).map(([league, leagueMatches]) => (
                  <div
                    key={league}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Header de liga */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <h3 style={{
                        color: 'white',
                        fontSize: '20px',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🏆 {league}
                        <span style={{
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontWeight: 'normal'
                        }}>
                          ({leagueMatches.length} partidos)
                        </span>
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => selectAllFromLeague(league)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ Todos
                        </button>
                        <button
                          onClick={() => clearLeagueSelection(league)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Ninguno
                        </button>
                      </div>
                    </div>

                    {/* Lista de partidos */}
                    <div style={{
                      display: 'grid',
                      gap: '12px'
                    }}>
                      {leagueMatches.map(match => (
                        <div
                          key={match.id}
                          onClick={() => toggleMatchSelection(match.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px',
                            background: selectedMatches.has(match.id)
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: selectedMatches.has(match.id)
                              ? '2px solid rgba(34, 197, 94, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: 'white',
                              marginBottom: '4px'
                            }}>
                              {match.homeTeam} vs {match.awayTeam}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                              📅 {formatMatchTime(match.date)}
                              {match.venue && ` • 🏟️ ${match.venue}`}
                              {match.round && ` • ${match.round}`}
                            </div>
                          </div>
                          
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: selectedMatches.has(match.id)
                              ? '#22c55e'
                              : 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            color: 'white'
                          }}>
                            {selectedMatches.has(match.id) ? '✓' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preview' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '20px',
            margin: '0 0 20px 0'
          }}>
            👀 Vista Previa de la Quiniela ({selectedMatches.size} partidos)
          </h3>
          
          {selectedMatches.size === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>📋</div>
              <p>No has seleccionado ningún partido aún</p>
            </div>
          ) : (
            <div>
              {getSelectedMatchesData()
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((match, index) => (
                  <div
                    key={match.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        minWidth: '24px',
                        textAlign: 'center'
                      }}>
                        {index + 1}
                      </span>
                      
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {match.league} • {formatMatchTime(match.date)}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleMatchSelection(match.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Quitar
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '20px',
            margin: '0 0 20px 0'
          }}>
            🎯 Crear Quiniela
          </h3>
          
          {selectedMatches.size === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
              <p>Debes seleccionar al menos un partido para crear una quiniela</p>
            </div>
          ) : (
            <div>
              {/* Resumen */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  color: 'white',
                  fontSize: '16px',
                  margin: '0 0 12px 0'
                }}>
                  📊 Resumen de la Quiniela
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#3b82f6'
                    }}>
                      {selectedMatches.size}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      Partidos seleccionados
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#10b981'
                    }}>
                      {[...new Set(getSelectedMatchesData().map(m => m.league))].length}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      Ligas incluidas
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#f59e0b'
                    }}>
                      {availableWeeks[selectedWeek]?.label || 'Semana seleccionada'}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      Período de partidos
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón crear */}
              <button
                onClick={createQuinielaFromSelection}
                disabled={creating || selectedMatches.size === 0}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: creating 
                    ? 'rgba(156, 163, 175, 0.3)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                {creating ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Creando Quiniela...
                  </>
                ) : (
                  <>
                    🎯 Crear Quiniela con {selectedMatches.size} Partidos
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}