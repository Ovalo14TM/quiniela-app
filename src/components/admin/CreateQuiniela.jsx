// src/components/admin/CreateQuiniela.jsx - Con deadline automático
import React, { useState, useEffect } from 'react';
import { getAllAvailableMatches } from '../../services/matchesService';
import { createWeeklyQuiniela, getCurrentWeekNumber } from '../../services/quinielaService';
import { formatMatchDate } from '../../services/footballService';
import { useAuth } from '../../context/AuthContext';

export default function CreateQuiniela({ onQuinielaCreated }) {
  const { currentUser } = useAuth();
  const [availableMatches, setAvailableMatches] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form data
  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [title, setTitle] = useState(`Semana ${getCurrentWeekNumber()} - ${new Date().getFullYear()}`);
  
  // Auto-calculated deadline info
  const [deadlineInfo, setDeadlineInfo] = useState(null);

  useEffect(() => {
    loadAvailableMatches();
  }, []);

  useEffect(() => {
    setTitle(`Semana ${weekNumber} - ${year}`);
  }, [weekNumber, year]);

  // Calcular deadline automáticamente cuando cambian los partidos seleccionados
  useEffect(() => {
    if (selectedMatches.size > 0) {
      calculateAutoDeadline();
    } else {
      setDeadlineInfo(null);
    }
  }, [selectedMatches, availableMatches]);

  const loadAvailableMatches = async () => {
    setLoading(true);
    try {
      const matches = await getAllAvailableMatches();
      // Filtrar solo partidos futuros
      const futureMatches = matches.filter(match => {
        const matchDate = match.date?.toDate ? match.date.toDate() : new Date(match.date);
        return matchDate > new Date();
      });
      setAvailableMatches(futureMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
    setLoading(false);
  };

  const calculateAutoDeadline = () => {
    const selectedMatchIds = Array.from(selectedMatches);
    const selectedMatchObjects = availableMatches.filter(match => 
      selectedMatchIds.includes(match.id)
    );

    if (selectedMatchObjects.length === 0) {
      setDeadlineInfo(null);
      return;
    }

    // Encontrar el primer partido (más temprano)
    const sortedMatches = selectedMatchObjects
      .map(match => ({
        ...match,
        date: match.date?.toDate ? match.date.toDate() : new Date(match.date)
      }))
      .sort((a, b) => a.date - b.date);

    const firstMatch = sortedMatches[0];
    const lastMatch = sortedMatches[sortedMatches.length - 1];

    // Deadline: 30 minutos antes del primer partido
    const deadline = new Date(firstMatch.date.getTime() - (30 * 60 * 1000));

    setDeadlineInfo({
      firstMatch,
      lastMatch,
      deadline,
      totalMatches: selectedMatchObjects.length,
      matchesSpan: {
        start: firstMatch.date,
        end: lastMatch.date
      }
    });
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
    if (selectedMatches.size === availableMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(availableMatches.map(match => match.id)));
    }
  };

  const handleCreateQuiniela = async () => {
    if (selectedMatches.size === 0) {
      alert('Selecciona al menos un partido para la quiniela');
      return;
    }

    if (!deadlineInfo) {
      alert('Error calculando el deadline automático');
      return;
    }

    setCreating(true);
    try {
      const quinielaData = {
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        title,
        matches: Array.from(selectedMatches),
        deadline: deadlineInfo.deadline,
        createdBy: currentUser.uid,
        firstMatchDate: deadlineInfo.firstMatch.date,
        lastMatchDate: deadlineInfo.lastMatch.date
      };

      await createWeeklyQuiniela(quinielaData);
      
      alert('¡Quiniela creada exitosamente!\n\n' +
            `📅 Primer partido: ${deadlineInfo.firstMatch.homeTeam} vs ${deadlineInfo.firstMatch.awayTeam}\n` +
            `⏰ Inicia: ${deadlineInfo.firstMatch.date.toLocaleString('es-MX')}\n` +
            `🔒 Deadline: ${deadlineInfo.deadline.toLocaleString('es-MX')}\n\n` +
            '¡Los usuarios ya pueden hacer sus predicciones!');
      
      // Reset form
      setSelectedMatches(new Set());
      setWeekNumber(getCurrentWeekNumber());
      setYear(new Date().getFullYear());
      
      if (onQuinielaCreated) {
        onQuinielaCreated();
      }
      
    } catch (error) {
      console.error('Error creating quiniela:', error);
      alert('Error al crear la quiniela');
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
          Cargando partidos...
        </p>
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Form Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          ➕ Crear Nueva Quiniela
        </h3>
        
        {/* Basic Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              📅 Semana
            </label>
            <input
              type="number"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              min="1"
              max="53"
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
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              🗓️ Año
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2024"
              max="2030"
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
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
              }}
            />
          </div>
        </div>
        
        {/* Title */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            🏆 Título de la Quiniela
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            placeholder="Ej: Semana 30 - 2025"
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.background = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            }}
          />
        </div>
      </div>

      {/* Deadline Info (Auto-calculado) */}
      {deadlineInfo && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚡ Información Automática
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h5 style={{
                fontWeight: 'bold',
                color: '#60a5fa',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🥇 Primer Partido
              </h5>
              <div style={{ color: '#93c5fd', fontSize: '14px', lineHeight: 1.4 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {deadlineInfo.firstMatch.homeTeam} vs {deadlineInfo.firstMatch.awayTeam}
                </div>
                <div>{deadlineInfo.firstMatch.league}</div>
                <div>{deadlineInfo.firstMatch.date.toLocaleString('es-MX')}</div>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h5 style={{
                fontWeight: 'bold',
                color: '#fbbf24',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🔒 Deadline Automático
              </h5>
              <div style={{ color: '#fcd34d', fontSize: '14px', lineHeight: 1.4 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {deadlineInfo.deadline.toLocaleString('es-MX')}
                </div>
                <div>30 minutos antes del primer partido</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Los usuarios podrán editar hasta esta hora
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h5 style={{
                fontWeight: 'bold',
                color: '#34d399',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                📊 Resumen
              </h5>
              <div style={{ color: '#6ee7b7', fontSize: '14px', lineHeight: 1.4 }}>
                <div>{deadlineInfo.totalMatches} partidos seleccionados</div>
                <div>Del {deadlineInfo.matchesSpan.start.toLocaleDateString()}</div>
                <div>Al {deadlineInfo.matchesSpan.end.toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Selection */}
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
            ⚽ Seleccionar Partidos ({availableMatches.length} disponibles)
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
              {selectedMatches.size === availableMatches.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          </div>
        </div>

        {availableMatches.length === 0 ? (
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
              No hay partidos disponibles
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              margin: 0
            }}>
              Primero añade partidos en la sección "Gestión de Partidos"
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
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedMatches.size === availableMatches.length && availableMatches.length > 0}
                      onChange={selectAllMatches}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </th>
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
                </tr>
              </thead>
              <tbody>
                {availableMatches.map((match) => (
                  <tr key={match.id} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    background: selectedMatches.has(match.id) ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedMatches.has(match.id)) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedMatches.has(match.id)) {
                      e.currentTarget.style.background = 'transparent';
                    } else {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }
                  }}
                  >
                    <td style={{ padding: '16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedMatches.has(match.id)}
                        onChange={() => toggleMatchSelection(match.id)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </td>
                    <td style={{
                      padding: '16px',
                      color: 'white'
                    }}>
                      <div style={{
                        fontWeight: 'bold'
                      }}>
                        {match.homeTeam} vs {match.awayTeam}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Button */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
          gap: '16px'
        }}>
          <div>
            <h4 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 8px 0'
            }}>
              Crear Quiniela
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 8px 0'
            }}>
              {selectedMatches.size} partidos seleccionados
            </p>
            {deadlineInfo && (
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0
              }}>
                Deadline automático: {deadlineInfo.deadline.toLocaleString('es-MX')}
              </p>
            )}
            
            {/* Progress indicator */}
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${availableMatches.length > 0 ? (selectedMatches.size / availableMatches.length) * 100 : 0}%`,
                height: '100%',
                background: selectedMatches.size > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
          
          <button
            onClick={handleCreateQuiniela}
            disabled={creating || selectedMatches.size === 0}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: (creating || selectedMatches.size === 0) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '200px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!creating && selectedMatches.size > 0) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!creating && selectedMatches.size > 0) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
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
                Creando...
              </>
            ) : (
              <>
                🏆 Crear Quiniela
              </>
            )}
          </button>
        </div>
      </div>

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