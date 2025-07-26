// src/components/admin/AdminMatchesCRUD.jsx - CRUD completo de partidos
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getAllAvailableMatches } from '../../services/matchesService';
import { formatMatchDate } from '../../services/footballService';

export default function AdminMatchesCRUD() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const matchesData = await getAllAvailableMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
    setLoading(false);
  };

  const handleEditMatch = async (matchId, updates) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      alert('✅ Partido actualizado correctamente');
      setEditingMatch(null);
      loadMatches();
    } catch (error) {
      console.error('Error updating match:', error);
      alert('❌ Error al actualizar partido');
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      // 1. Verificar si tiene predicciones
      const predictionsQuery = query(
        collection(db, 'predictions'),
        where('matchId', '==', matchId)
      );
      const predictions = await getDocs(predictionsQuery);
      
      if (!predictions.empty) {
        const confirm = window.confirm(
          '⚠️ Este partido tiene predicciones activas.\n' +
          'Eliminar el partido también eliminará:\n' +
          `• ${predictions.size} predicciones de usuarios\n` +
          '• Puntos asociados\n\n' +
          '¿Estás seguro?'
        );
        
        if (!confirm) return;
        
        // Eliminar predicciones
        const batch = [];
        predictions.forEach((doc) => {
          batch.push(deleteDoc(doc.ref));
        });
        await Promise.all(batch);
      }
      
      // 2. Verificar si está en quinielas activas
      const quinielasQuery = query(
        collection(db, 'quinielas'),
        where('matches', 'array-contains', matchId),
        where('status', 'in', ['open', 'closed'])
      );
      const quinielas = await getDocs(quinielasQuery);
      
      if (!quinielas.empty) {
        alert('❌ No se puede eliminar: está en quinielas activas');
        return;
      }
      
      // 3. Eliminar partido
      await deleteDoc(doc(db, 'matches', matchId));
      
      alert('✅ Partido eliminado correctamente');
      setShowDeleteModal(null);
      loadMatches();
      
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('❌ Error al eliminar partido');
    }
  };

  const handleStatusChange = async (matchId, newStatus) => {
    await handleEditMatch(matchId, { status: newStatus });
  };

  const filteredMatches = matches.filter(match => {
    if (filterStatus === 'all') return true;
    return match.status === filterStatus;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cargando partidos...</p>
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
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
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0
          }}>
            Administrar partidos del sistema ({matches.length} total)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#374151'
            }}
          >
            <option value="all">Todos los partidos</option>
            <option value="SCHEDULED">Programados</option>
            <option value="LIVE">En vivo</option>
            <option value="FINISHED">Terminados</option>
          </select>
          
          <button
            onClick={loadMatches}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Lista de Partidos */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {filteredMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>⚽</div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
              No hay partidos {filterStatus !== 'all' ? `con estado "${filterStatus}"` : 'disponibles'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isEditing={editingMatch === match.id}
                onEdit={() => setEditingMatch(match.id)}
                onSave={(updates) => handleEditMatch(match.id, updates)}
                onCancel={() => setEditingMatch(null)}
                onDelete={() => setShowDeleteModal(match)}
                onStatusChange={(status) => handleStatusChange(match.id, status)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0'
            }}>
              ⚠️ Confirmar Eliminación
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px',
              lineHeight: 1.6
            }}>
              ¿Estás seguro de eliminar el partido:
              <br/><strong>{showDeleteModal.homeTeam} vs {showDeleteModal.awayTeam}</strong>?
              <br/><br/>
              Esta acción es <strong>irreversible</strong> y eliminará:
              <br/>• Todas las predicciones asociadas
              <br/>• Puntos de los usuarios
              <br/>• Historial del partido
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteModal(null)}
                style={{
                  background: 'rgba(156, 163, 175, 0.2)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156, 163, 175, 0.4)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
              <button
                onClick={() => handleDeleteMatch(showDeleteModal.id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🗑️ Eliminar Partido
              </button>
            </div>
          </div>
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

// Componente para cada partido
function MatchCard({ match, isEditing, onEdit, onSave, onCancel, onDelete, onStatusChange }) {
  const [formData, setFormData] = useState({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    date: match.date?.toDate ? match.date.toDate().toISOString().slice(0, 16) : new Date(match.date).toISOString().slice(0, 16)
  });

  const handleSave = () => {
    const updates = {
      homeTeam: formData.homeTeam,
      awayTeam: formData.awayTeam,
      league: formData.league,
      date: new Date(formData.date)
    };
    onSave(updates);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px'
      }}>
        {/* Información del Partido */}
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeTeam: e.target.value }))}
                  placeholder="Equipo Local"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#374151'
                  }}
                />
                <input
                  type="text"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, awayTeam: e.target.value }))}
                  placeholder="Equipo Visitante"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#374151'
                  }}
                />
              </div>
              <input
                type="text"
                value={formData.league}
                onChange={(e) => setFormData(prev => ({ ...prev, league: e.target.value }))}
                placeholder="Liga/Competición"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#374151'
                }}
              />
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#374151'
                }}
              />
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {match.league}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
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
                   match.status === 'LIVE' ? '🔴 En Vivo' : '⏳ Programado'}
                </span>
              </div>
              
              <h4 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 8px 0'
              }}>
                {match.homeTeam} vs {match.awayTeam}
              </h4>
              
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div>📅 {formatMatchDate(match.date)}</div>
                {match.homeScore !== null && match.awayScore !== null && (
                  <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                    📊 Resultado: {match.homeScore} - {match.awayScore}
                  </div>
                )}
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  🆔 {match.id} • 📝 {match.source || 'manual'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ✅ Guardar
              </button>
              <button
                onClick={onCancel}
                style={{
                  background: 'rgba(156, 163, 175, 0.2)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156, 163, 175, 0.4)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ❌ Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ✏️ Editar
              </button>
              
              {/* Cambiar estado */}
              <select
                value={match.status}
                onChange={(e) => onStatusChange(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#374151',
                  fontSize: '12px'
                }}
              >
                <option value="SCHEDULED">⏳ Programado</option>
                <option value="LIVE">🔴 En Vivo</option>
                <option value="FINISHED">✅ Terminado</option>
              </select>
              
              <button
                onClick={onDelete}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🗑️ Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}