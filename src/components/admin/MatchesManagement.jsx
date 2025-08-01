// src/components/admin/MatchesManagement.jsx - Con operaciones masivas mejoradas
import React, { useState, useEffect } from 'react';
import { getAllAvailableMatches, saveMatch } from '../../services/matchesService';
import { formatMatchDate, formatMatchScore } from '../../services/footballService';
import { useAuth } from '../../context/AuthContext';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isActive ? '0 8px 25px rgba(102, 126, 234, 0.3)' : 'none'
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
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '4px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ color: 'white' }}>
      {/* Header Mejorado */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }}></div>

        <div style={{
          position: 'relative',
          zIndex: 1,
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #ffffff 0%, #667eea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0'
          }}>
            ⚽ Gestión de Partidos
          </h3>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 20px 0',
            maxWidth: '600px'
          }}>
            Administra partidos de forma individual o masiva. Crea jornadas completas, duplica partidos y optimiza tu flujo de trabajo.
          </p>

          {/* Quick Stats */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {[
              { label: 'Total', count: savedMatches.length, icon: '📊', color: 'rgba(59, 130, 246, 0.2)' },
              { label: 'Programados', count: savedMatches.filter(m => m.status === 'SCHEDULED').length, icon: '⏳', color: 'rgba(245, 158, 11, 0.2)' },
              { label: 'Terminados', count: savedMatches.filter(m => m.status === 'FINISHED').length, icon: '✅', color: 'rgba(16, 185, 129, 0.2)' }
            ].map((stat) => (
              <div key={stat.label} style={{
                background: stat.color,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{stat.count}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Mejorados */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative',
          zIndex: 1
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
            label="Agregar Individual"
            icon="➕"
            isActive={activeTab === 'manual'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="bulk"
            label="Agregar Masivo"
            icon="🚀"
            isActive={activeTab === 'bulk'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="template"
            label="Plantillas"
            icon="📋"
            isActive={activeTab === 'template'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="import"
            label="Importar"
            icon="📤"
            isActive={activeTab === 'import'}
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
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💾 Partidos Guardados 
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                {savedMatches.length}
              </span>
            </h4>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={loadSavedMatches}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  color: 'white',
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
                  e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {savedMatches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(31, 41, 55, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '120px', marginBottom: '24px', opacity: 0.7 }}>
                ⚽
              </div>
              <h3 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 12px 0'
              }}>
                No hay partidos guardados
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                margin: '0 0 24px 0',
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                Comienza agregando partidos individual o masivamente para crear tus quinielas
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('manual')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Agregar Individual
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Agregar Masivo
                </button>
              </div>
            </div>
          ) : (
            <MatchTable matches={savedMatches} />
          )}
        </div>
      )}

      {/* Agregar Individual */}
      {activeTab === 'manual' && (
        <ManualMatchForm onMatchAdded={loadSavedMatches} />
      )}

      {/* Agregar Masivo */}
      {activeTab === 'bulk' && (
        <BulkMatchForm onMatchesAdded={loadSavedMatches} />
      )}

      {/* Plantillas */}
      {activeTab === 'template' && (
        <TemplateForm onMatchesAdded={loadSavedMatches} />
      )}

      {/* Importar */}
      {activeTab === 'import' && (
        <ImportForm onMatchesAdded={loadSavedMatches} />
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Componente mejorado para la tabla de partidos
function MatchTable({ matches }) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }) => (
    <th 
      onClick={() => handleSort(field)}
      style={{
        padding: '16px',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.9)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
        {sortField === field && (
          <span style={{ fontSize: '12px' }}>
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div style={{ 
      overflowX: 'auto',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{
            background: 'rgba(255, 255, 255, 0.1)'
          }}>
            <SortableHeader field="homeTeam">🆚 Partido</SortableHeader>
            <SortableHeader field="league">🏆 Liga</SortableHeader>
            <SortableHeader field="date">📅 Fecha</SortableHeader>
            <SortableHeader field="status">📊 Estado</SortableHeader>
          </tr>
        </thead>
        <tbody>
          {sortedMatches.map((match, index) => (
            <tr key={match.id} style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
              <td style={{
                padding: '16px',
                color: 'white'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  fontSize: '16px'
                }}>
                  {match.homeTeam} <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>vs</span> {match.awayTeam}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {formatMatchScore(match.homeScore, match.awayScore)}
                  {match.source && (
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      📝 {match.source}
                    </span>
                  )}
                </div>
              </td>
              <td style={{
                padding: '16px',
                fontSize: '14px',
                color: 'white'
              }}>
                <span style={{
                  background: 'rgba(102, 126, 234, 0.2)',
                  border: '1px solid rgba(102, 126, 234, 0.4)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#667eea'
                }}>
                  {match.league}
                </span>
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
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '8px',
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
                   match.status === 'LIVE' ? '🔴 En Vivo' : '⏳ Programado'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente individual (mantener el original pero mejorado)
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

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateString = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      date: dateString,
      time: '15:00'
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
      
      setFormData({
        homeTeam: '',
        awayTeam: '',
        league: '',
        date: '',
        time: ''
      });
      
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
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h4 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #ffffff 0%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        ➕ Agregar Nuevo Partido
      </h4>
      
      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
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
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            placeholder="Ej: Real Madrid"
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.background = 'white';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'scale(1)';
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
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            placeholder="Ej: FC Barcelona"
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.background = 'white';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'scale(1)';
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
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            placeholder="Ej: La Liga, Champions League"
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.background = 'white';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'scale(1)';
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
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.background = 'white';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'scale(1)';
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
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.background = 'white';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'scale(1)';
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
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: saving ? 0.7 : 1,
              minWidth: '200px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
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
    </div>
  );
}

// Nuevo componente para agregar múltiples partidos
function BulkMatchForm({ onMatchesAdded }) {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([
    { homeTeam: '', awayTeam: '', league: '', date: '', time: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    league: '',
    date: '',
    startTime: '15:00',
    intervalMinutes: 120
  });

  const addMatch = () => {
    setMatches([...matches, { homeTeam: '', awayTeam: '', league: '', date: '', time: '' }]);
  };

  const removeMatch = (index) => {
    if (matches.length > 1) {
      setMatches(matches.filter((_, i) => i !== index));
    }
  };

  const updateMatch = (index, field, value) => {
    const newMatches = [...matches];
    newMatches[index][field] = value;
    setMatches(newMatches);
  };

  const applyGlobalSettings = () => {
    const newMatches = matches.map((match, index) => {
      const baseTime = globalSettings.startTime.split(':');
      const startMinutes = parseInt(baseTime[0]) * 60 + parseInt(baseTime[1]);
      const matchMinutes = startMinutes + (index * globalSettings.intervalMinutes);
      const hours = Math.floor(matchMinutes / 60) % 24;
      const minutes = matchMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        ...match,
        league: globalSettings.league || match.league,
        date: globalSettings.date || match.date,
        time: timeString
      };
    });
    setMatches(newMatches);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validMatches = matches.filter(match => 
      match.homeTeam && match.awayTeam && match.league && match.date && match.time
    );

    if (validMatches.length === 0) {
      alert('Por favor completa al menos un partido completo');
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      validMatches.forEach((match) => {
        const matchDate = new Date(`${match.date}T${match.time}:00`);
        const matchData = {
          id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          homeTeam: match.homeTeam.trim(),
          awayTeam: match.awayTeam.trim(),
          league: match.league.trim(),
          date: matchDate,
          source: 'bulk_manual',
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          createdBy: currentUser.uid,
          createdAt: new Date()
        };

        const docRef = doc(db, 'matches', matchData.id);
        batch.set(docRef, matchData);
      });

      await batch.commit();
      
      alert(`✅ ${validMatches.length} partidos agregados correctamente`);
      
      setMatches([{ homeTeam: '', awayTeam: '', league: '', date: '', time: '' }]);
      setGlobalSettings({ league: '', date: '', startTime: '15:00', intervalMinutes: 120 });
      
      onMatchesAdded();
      
    } catch (error) {
      console.error('Error saving matches:', error);
      alert('❌ Error al agregar los partidos');
    }
    setSaving(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h4 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #ffffff 0%, #8b5cf6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        🚀 Agregar Múltiples Partidos
      </h4>

      {/* Configuración Global */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h5 style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚙️ Configuración Global
        </h5>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              🏆 Liga (para todos)
            </label>
            <input
              type="text"
              value={globalSettings.league}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, league: e.target.value }))}
              placeholder="Ej: Liga MX"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              📅 Fecha (para todos)
            </label>
            <input
              type="date"
              value={globalSettings.date}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, date: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              ⏰ Hora inicial
            </label>
            <input
              type="time"
              value={globalSettings.startTime}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, startTime: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              ⏱️ Intervalo (min)
            </label>
            <input
              type="number"
              value={globalSettings.intervalMinutes}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) || 120 }))}
              min="30"
              max="360"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        
        <button
          onClick={applyGlobalSettings}
          type="button"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔄 Aplicar a Todos
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Lista de Partidos */}
        <div style={{ marginBottom: '24px' }}>
          {matches.map((match, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h6 style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚽ Partido #{index + 1}
                </h6>
                
                {matches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMatch(index)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                <input
                  type="text"
                  value={match.homeTeam}
                  onChange={(e) => updateMatch(index, 'homeTeam', e.target.value)}
                  placeholder="Equipo Local"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
                
                <input
                  type="text"
                  value={match.awayTeam}
                  onChange={(e) => updateMatch(index, 'awayTeam', e.target.value)}
                  placeholder="Equipo Visitante"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
                
                <input
                  type="text"
                  value={match.league}
                  onChange={(e) => updateMatch(index, 'league', e.target.value)}
                  placeholder="Liga"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
                
                <input
                  type="date"
                  value={match.date}
                  onChange={(e) => updateMatch(index, 'date', e.target.value)}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
                
                <input
                  type="time"
                  value={match.time}
                  onChange={(e) => updateMatch(index, 'time', e.target.value)}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={addMatch}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Agregar Otro Partido
          </button>
          
          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: saving ? 0.7 : 1
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
                💾 Guardar Todos ({matches.filter(m => m.homeTeam && m.awayTeam).length})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente para plantillas de jornadas
function TemplateForm({ onMatchesAdded }) {
  const { currentUser } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateData, setTemplateData] = useState({
    league: '',
    startDate: '',
    startTime: '15:00'
  });
  const [saving, setSaving] = useState(false);

  const templates = {
    ligamx: {
      name: 'Liga MX - Jornada Típica',
      matches: [
        { home: 'América', away: 'Chivas' },
        { home: 'Cruz Azul', away: 'Pumas' },
        { home: 'Tigres', away: 'Monterrey' },
        { home: 'Santos', away: 'León' },
        { home: 'Toluca', away: 'Atlas' },
        { home: 'Puebla', away: 'Necaxa' },
        { home: 'Pachuca', away: 'Querétaro' },
        { home: 'Tijuana', away: 'Mazatlán' },
        { home: 'Juárez', away: 'San Luis' }
      ]
    },
    champions: {
      name: 'Champions League - Grupo',
      matches: [
        { home: 'Real Madrid', away: 'Barcelona' },
        { home: 'Bayern Munich', away: 'PSG' },
        { home: 'Manchester City', away: 'Liverpool' },
        { home: 'Juventus', away: 'AC Milan' }
      ]
    },
    premier: {
      name: 'Premier League - Jornada',
      matches: [
        { home: 'Manchester United', away: 'Arsenal' },
        { home: 'Chelsea', away: 'Tottenham' },
        { home: 'Liverpool', away: 'Manchester City' },
        { home: 'Newcastle', away: 'West Ham' },
        { home: 'Brighton', away: 'Aston Villa' }
      ]
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTemplate || !templateData.league || !templateData.startDate) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSaving(true);
    try {
      const template = templates[selectedTemplate];
      const batch = writeBatch(db);
      
      template.matches.forEach((match, index) => {
        const matchDate = new Date(`${templateData.startDate}T${templateData.startTime}:00`);
        matchDate.setHours(matchDate.getHours() + (index * 2)); // 2 horas entre partidos
        
        const matchData = {
          id: `template_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          homeTeam: match.home,
          awayTeam: match.away,
          league: templateData.league,
          date: matchDate,
          source: 'template',
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          createdBy: currentUser.uid,
          createdAt: new Date()
        };

        const docRef = doc(db, 'matches', matchData.id);
        batch.set(docRef, matchData);
      });

      await batch.commit();
      
      alert(`✅ ${template.matches.length} partidos creados desde plantilla "${template.name}"`);
      
      setSelectedTemplate('');
      setTemplateData({ league: '', startDate: '', startTime: '15:00' });
      
      onMatchesAdded();
      
    } catch (error) {
      console.error('Error creating from template:', error);
      alert('❌ Error al crear partidos desde plantilla');
    }
    setSaving(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h4 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        📋 Plantillas de Jornadas
      </h4>

      <p style={{
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '24px',
        fontSize: '16px'
      }}>
        Crea jornadas completas rápidamente usando plantillas predefinidas
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Selección de Plantilla */}
        <div>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            📋 Seleccionar Plantilla
          </label>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(templates).map(([key, template]) => (
              <div
                key={key}
                onClick={() => setSelectedTemplate(key)}
                style={{
                  background: selectedTemplate === key 
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTemplate === key 
                    ? '2px solid rgba(168, 85, 247, 0.6)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <h5 style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  {template.name}
                </h5>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: '0 0 12px 0'
                }}>
                  {template.matches.length} partidos incluidos
                </p>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {template.matches.slice(0, 3).map(match => 
                    `${match.home} vs ${match.away}`
                  ).join(', ')}
                  {template.matches.length > 3 && '...'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuración */}
        {selectedTemplate && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h5 style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              ⚙️ Configurar Jornada
            </h5>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  🏆 Liga/Competición
                </label>
                <input
                  type="text"
                  value={templateData.league}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, league: e.target.value }))}
                  placeholder="Ej: Liga MX Jornada 15"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  📅 Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={templateData.startDate}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  ⏰ Hora del Primer Partido
                </label>
                <input
                  type="time"
                  value={templateData.startTime}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, startTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                margin: 0
              }}>
                💡 Los partidos se programarán cada 2 horas comenzando desde la hora especificada
              </p>
            </div>
          </div>
        )}

        {/* Botón de Crear */}
        {selectedTemplate && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: saving ? 0.7 : 1,
                margin: '0 auto'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creando Jornada...
                </>
              ) : (
                <>
                  🚀 Crear {templates[selectedTemplate]?.matches.length} Partidos
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// Componente para importar desde archivo
function ImportForm({ onMatchesAdded }) {
  const { currentUser } = useAuth();
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileImport = async (file) => {
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    
    if (fileType !== 'csv' && fileType !== 'json') {
      alert('Solo se permiten archivos CSV o JSON');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      let matches = [];

      if (fileType === 'csv') {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const match = {};
          
          headers.forEach((header, index) => {
            if (values[index]) {
              match[header] = values[index].replace(/"/g, '');
            }
          });
          
          if (match.hometeam && match.awayteam && match.league && match.date) {
            matches.push({
              homeTeam: match.hometeam || match.home,
              awayTeam: match.awayteam || match.away,
              league: match.league,
              date: new Date(match.date + (match.time ? `T${match.time}:00` : 'T15:00:00'))
            });
          }
        }
      } else if (fileType === 'json') {
        const data = JSON.parse(text);
        matches = Array.isArray(data) ? data : [data];
        
        matches = matches.map(match => ({
          homeTeam: match.homeTeam || match.home,
          awayTeam: match.awayTeam || match.away,
          league: match.league,
          date: new Date(match.date)
        })).filter(match => match.homeTeam && match.awayTeam && match.league && match.date);
      }

      if (matches.length === 0) {
        alert('No se encontraron partidos válidos en el archivo');
        return;
      }

      const batch = writeBatch(db);
      
      matches.forEach((match) => {
        const matchData = {
          id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: match.date,
          source: `import_${fileType}`,
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          createdBy: currentUser.uid,
          createdAt: new Date()
        };

        const docRef = doc(db, 'matches', matchData.id);
        batch.set(docRef, matchData);
      });

      await batch.commit();
      
      alert(`✅ ${matches.length} partidos importados correctamente`);
      onMatchesAdded();
      
    } catch (error) {
      console.error('Error importing file:', error);
      alert('❌ Error al importar el archivo');
    }
    setImporting(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h4 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #ffffff 0%, #f59e0b 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        📤 Importar Partidos
      </h4>

      <p style={{
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '24px',
        fontSize: '16px'
      }}>
        Importa múltiples partidos desde archivos CSV o JSON
      </p>

      {/* Zona de Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragOver ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)'}`,
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          background: dragOver 
            ? 'rgba(245, 158, 11, 0.1)' 
            : 'rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s ease',
          marginBottom: '24px'
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {importing ? '⏳' : dragOver ? '📥' : '📤'}
        </div>
        
        {importing ? (
          <div>
            <h5 style={{ color: 'white', fontSize: '18px', margin: '0 0 8px 0' }}>
              Importando partidos...
            </h5>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid #f59e0b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        ) : (
          <div>
            <h5 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              {dragOver ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo aquí'}
            </h5>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              margin: '0 0 16px 0'
            }}>
              o haz clic para seleccionar
            </p>
            
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => handleFileImport(e.target.files[0])}
              style={{ display: 'none' }}
              id="file-input"
            />
            
            <label
              htmlFor="file-input"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-block'
              }}
            >
              📁 Seleccionar Archivo
            </label>
          </div>
        )}
      </div>

      {/* Formatos Soportados */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h5 style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0 0 16px 0'
        }}>
          📋 Formatos Soportados
        </h5>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {/* CSV */}
          <div>
            <h6 style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 8px 0'
            }}>
              📊 CSV (Comma Separated Values)
            </h6>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.8)',
              overflow: 'auto',
              margin: 0
            }}>
{`homeTeam,awayTeam,league,date,time
América,Chivas,Liga MX,2024-12-25,15:00
Cruz Azul,Pumas,Liga MX,2024-12-25,17:00`}
            </pre>
          </div>
          
          {/* JSON */}
          <div>
            <h6 style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 8px 0'
            }}>
              🔗 JSON (JavaScript Object Notation)
            </h6>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.8)',
              overflow: 'auto',
              margin: 0
            }}>
{`[
  {
    "homeTeam": "América",
    "awayTeam": "Chivas", 
    "league": "Liga MX",
    "date": "2024-12-25T15:00:00"
  }
]`}
            </pre>
          </div>
        </div>
        
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            margin: 0
          }}>
            💡 <strong>Campos obligatorios:</strong> homeTeam, awayTeam, league, date
            <br/>
            📅 <strong>Formato de fecha:</strong> YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS
          </p>
        </div>
      </div>
    </div>
  );
}