// src/components/admin/MatchesManagement.jsx - Solo partidos manuales
import React, { useState, useEffect } from 'react';
import { getAllAvailableMatches, saveMatch } from '../../services/matchesService';
import { formatMatchDate, formatMatchScore } from '../../services/footballService';
import { useAuth } from '../../context/AuthContext';

export default function MatchesManagement() {
  const { currentUser } = useAuth();
  const [savedMatches, setSavedMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    loadSavedMatches();
  }, []);

  const loadSavedMatches = async () => {
    try {
      const matches = await getAllAvailableMatches();
      setSavedMatches(matches);
    } catch (error) {
      console.error('Error loading saved matches:', error);
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
          marginBottom: '20px'
        }}>
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
            Añade partidos manualmente para crear quinielas
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
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
            label="Agregar Nuevo"
            icon="➕"
            isActive={activeTab === 'manual'}
            onClick={setActiveTab}
          />
        </div>
      </div>

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
                Añade partidos manualmente para crear quinielas
              </p>
            </div>
          ) : (
            <MatchTable matches={savedMatches} />
          )}
        </div>
      )}

      {/* Agregar Manual */}
      {activeTab === 'manual' && (
        <ManualMatchForm onMatchAdded={loadSavedMatches} />
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Componente para la tabla de partidos
function MatchTable({ matches }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente para agregar partidos manualmente
function ManualMatchForm({ onMatchAdded }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    league: '',
    date: '',
    time: ''
  });
  const [saving, setSaving] = useState(false);

  // Establecer fecha y hora por defecto
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateString = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      date: dateString,
      time: '15:00' // 3:00 PM por defecto
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.homeTeam || !formData.awayTeam || !formData.league || !formData.date || !formData.time) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSaving(true);
    try {
      // Crear objeto Date combinando fecha y hora
      const matchDate = new Date(`${formData.date}T${formData.time}:00`);
      
      const matchData = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        homeTeam: formData.homeTeam.trim(),
        awayTeam: formData.awayTeam.trim(),
        league: formData.league.trim(),
        date: matchDate,
        source: 'manual',
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        createdBy: currentUser.uid,
        createdAt: new Date()
      };

      await saveMatch(matchData);
      
      alert('✅ Partido agregado correctamente');
      
      // Reset form
      setFormData({
        homeTeam: '',
        awayTeam: '',
        league: '',
        date: '',
        time: ''
      });
      
      // Establecer nueva fecha por defecto
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: dateString,
        time: '15:00'
      }));
      
      onMatchAdded();
      
    } catch (error) {
      console.error('Error saving match:', error);
      alert('❌ Error al agregar el partido');
    }
    setSaving(false);
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
        ➕ Agregar Nuevo Partido
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
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            🏆 Liga/Competición
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
            placeholder="Ej: La Liga, Champions League"
            required
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

        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '16px'
        }}>
          <button
            type="submit"
            disabled={saving}
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
              gap: '8px',
              opacity: saving ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Guardando...
              </>
            ) : (
              <>
                ➕ Agregar Partido
              </>
            )}
          </button>
        </div>
      </form>

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