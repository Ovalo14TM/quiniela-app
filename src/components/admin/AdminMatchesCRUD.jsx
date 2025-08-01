// src/components/admin/AdminMatchesCRUD.jsx - CRUD con operaciones masivas
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  writeBatch
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
  
  // Estados para operaciones masivas
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    league: '',
    dateOffset: 0 // días para mover fecha
  });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Funciones de selección masiva
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
    if (selectedMatches.size === filteredMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(filteredMatches.map(m => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedMatches(new Set());
    setBulkEditMode(false);
    setShowBulkActions(false);
  };

  // Operaciones masivas
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedMatches.size === 0) return;
    
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      selectedMatches.forEach(matchId => {
        const matchRef = doc(db, 'matches', matchId);
        batch.update(matchRef, {
          status: newStatus,
          updatedAt: new Date()
        });
      });
      
      await batch.commit();
      alert(`✅ ${selectedMatches.size} partidos actualizados a "${newStatus}"`);
      clearSelection();
      loadMatches();
    } catch (error) {
      console.error('Error updating matches:', error);
      alert('❌ Error en actualización masiva');
    }
    setSaving(false);
  };

  const handleBulkLeagueChange = async (newLeague) => {
    if (selectedMatches.size === 0 || !newLeague.trim()) return;
    
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      selectedMatches.forEach(matchId => {
        const matchRef = doc(db, 'matches', matchId);
        batch.update(matchRef, {
          league: newLeague.trim(),
          updatedAt: new Date()
        });
      });
      
      await batch.commit();
      alert(`✅ Liga actualizada en ${selectedMatches.size} partidos`);
      clearSelection();
      loadMatches();
    } catch (error) {
      console.error('Error updating leagues:', error);
      alert('❌ Error al actualizar ligas');
    }
    setSaving(false);
  };

  const handleBulkDateChange = async (daysOffset) => {
    if (selectedMatches.size === 0 || daysOffset === 0) return;
    
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      selectedMatches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match) {
          const currentDate = match.date?.toDate ? match.date.toDate() : new Date(match.date);
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + daysOffset);
          
          const matchRef = doc(db, 'matches', matchId);
          batch.update(matchRef, {
            date: newDate,
            updatedAt: new Date()
          });
        }
      });
      
      await batch.commit();
      alert(`✅ Fechas actualizadas en ${selectedMatches.size} partidos (${daysOffset > 0 ? '+' : ''}${daysOffset} días)`);
      clearSelection();
      loadMatches();
    } catch (error) {
      console.error('Error updating dates:', error);
      alert('❌ Error al actualizar fechas');
    }
    setSaving(false);
  };

  const handleBulkDelete = async () => {
    if (selectedMatches.size === 0) return;
    
    const confirm = window.confirm(
      `⚠️ ¿Eliminar ${selectedMatches.size} partidos seleccionados?\n\n` +
      'Esta acción eliminará:\n' +
      '• Los partidos seleccionados\n' +
      '• Todas sus predicciones\n' +
      '• Puntos asociados\n\n' +
      'Esta acción es IRREVERSIBLE'
    );
    
    if (!confirm) return;
    
    setSaving(true);
    try {
      // Eliminar predicciones primero
      for (const matchId of selectedMatches) {
        const predictionsQuery = query(
          collection(db, 'predictions'),
          where('matchId', '==', matchId)
        );
        const predictions = await getDocs(predictionsQuery);
        
        const batch = writeBatch(db);
        predictions.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
      
      // Eliminar partidos
      const matchBatch = writeBatch(db);
      selectedMatches.forEach(matchId => {
        const matchRef = doc(db, 'matches', matchId);
        matchBatch.delete(matchRef);
      });
      await matchBatch.commit();
      
      alert(`✅ ${selectedMatches.size} partidos eliminados correctamente`);
      clearSelection();
      loadMatches();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('❌ Error en eliminación masiva');
    }
    setSaving(false);
  };

  // Funciones individuales (mantener compatibilidad)
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
        
        const batch = writeBatch(db);
        predictions.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
      
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid rgba(255, 255, 255, 0.2)',
          borderTop: '6px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '18px',
          fontWeight: '500'
        }}>
          Cargando partidos...
        </p>
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Header Mejorado */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: selectedMatches.size > 0 ? '20px' : '0'
        }}>
          <div>
            <h3 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 8px 0'
            }}>
              ⚽ Gestión de Partidos
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 16px 0',
              fontSize: '16px'
            }}>
              Administrar partidos del sistema ({matches.length} total, {filteredMatches.length} mostrados)
            </p>
            
            {/* Stats rápidas */}
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              {['SCHEDULED', 'LIVE', 'FINISHED'].map(status => {
                const count = matches.filter(m => m.status === status).length;
                const colors = {
                  SCHEDULED: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: '#3b82f6' },
                  LIVE: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', text: '#f59e0b' },
                  FINISHED: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', text: '#10b981' }
                };
                return (
                  <div key={status} style={{
                    background: colors[status].bg,
                    border: `1px solid ${colors[status].border}`,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors[status].text
                  }}>
                    {status === 'SCHEDULED' ? '⏳' : status === 'LIVE' ? '🔴' : '✅'} {status}: {count}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Filtro por estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <option value="all">📋 Todos los partidos</option>
              <option value="SCHEDULED">⏳ Programados</option>
              <option value="LIVE">🔴 En vivo</option>
              <option value="FINISHED">✅ Terminados</option>
            </select>
            
            <button
              onClick={loadMatches}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
                  Actualizando...
                </>
              ) : (
                <>🔄 Actualizar</>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Selección Masiva */}
        {filteredMatches.length > 0 && (
          <div style={{
            background: selectedMatches.size > 0 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${selectedMatches.size > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={selectAllMatches}
                style={{
                  background: 'none',
                  border: `2px solid ${selectedMatches.size === filteredMatches.length ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: selectedMatches.size === filteredMatches.length ? '#10b981' : 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                {selectedMatches.size === filteredMatches.length ? '✅' : '☐'} 
                {selectedMatches.size === filteredMatches.length ? ' Deseleccionar Todo' : ' Seleccionar Todo'}
              </button>
              
              {selectedMatches.size > 0 && (
                <div style={{
                  color: '#10b981',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>🎯</span>
                  {selectedMatches.size} partido{selectedMatches.size !== 1 ? 's' : ''} seleccionado{selectedMatches.size !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {selectedMatches.size > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🛠️ Acciones Masivas
                </button>
                
                <button
                  onClick={clearSelection}
                  style={{
                    background: 'rgba(156, 163, 175, 0.2)',
                    color: '#9ca3af',
                    border: '1px solid rgba(156, 163, 175, 0.4)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Limpiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Panel de Acciones Masivas */}
        {showBulkActions && selectedMatches.size > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '16px'
          }}>
            <h4 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🛠️ Acciones Masivas ({selectedMatches.size} partidos)
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {/* Cambiar Estado */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  📊 Cambiar Estado
                </h5>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['SCHEDULED', 'LIVE', 'FINISHED'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusChange(status)}
                      disabled={saving}
                      style={{
                        background: status === 'SCHEDULED' 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : status === 'LIVE' 
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                        border: `1px solid ${status === 'SCHEDULED' 
                          ? 'rgba(59, 130, 246, 0.4)' 
                          : status === 'LIVE' 
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'rgba(16, 185, 129, 0.4)'}`,
                        color: status === 'SCHEDULED' ? '#3b82f6' : status === 'LIVE' ? '#f59e0b' : '#10b981',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      {status === 'SCHEDULED' ? '⏳' : status === 'LIVE' ? '🔴' : '✅'} {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cambiar Liga */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  🏆 Cambiar Liga
                </h5>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Nueva liga..."
                    value={bulkEditData.league}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, league: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#374151',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => {
                      handleBulkLeagueChange(bulkEditData.league);
                      setBulkEditData(prev => ({ ...prev, league: '' }));
                    }}
                    disabled={saving || !bulkEditData.league.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: saving || !bulkEditData.league.trim() ? 'not-allowed' : 'pointer',
                      opacity: saving || !bulkEditData.league.trim() ? 0.6 : 1
                    }}
                  >
                    ✅ Aplicar
                  </button>
                </div>
              </div>

              {/* Mover Fechas */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  📅 Mover Fechas
                </h5>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[-7, -1, 1, 7].map(days => (
                    <button
                      key={days}
                      onClick={() => handleBulkDateChange(days)}
                      disabled={saving}
                      style={{
                        background: 'rgba(147, 51, 234, 0.2)',
                        border: '1px solid rgba(147, 51, 234, 0.4)',
                        color: '#9333ea',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      {days > 0 ? '+' : ''}{days} día{Math.abs(days) !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eliminar Seleccionados */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  🗑️ Zona Peligrosa
                </h5>
                <button
                  onClick={handleBulkDelete}
                  disabled={saving}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    width: '100%'
                  }}
                >
                  🗑️ Eliminar {selectedMatches.size} Partido{selectedMatches.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
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
            <div style={{ fontSize: '80px', marginBottom: '16px', opacity: 0.7 }}>⚽</div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px', margin: 0 }}>
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
                isSelected={selectedMatches.has(match.id)}
                onToggleSelect={() => toggleMatchSelection(match.id)}
                onEdit={() => setEditingMatch(match.id)}
                onSave={(updates) => handleEditMatch(match.id, updates)}
                onCancel={() => setEditingMatch(null)}
                onDelete={() => setShowDeleteModal(match)}
                onStatusChange={(status) => handleStatusChange(match.id, status)}
                bulkMode={selectedMatches.size > 0}
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
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(31, 41, 55, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0'
            }}>
              Confirmar Eliminación
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px',
              lineHeight: 1.6,
              fontSize: '16px'
            }}>
              ¿Estás seguro de eliminar el partido:
              <br/><strong style={{ color: 'white' }}>{showDeleteModal.homeTeam} vs {showDeleteModal.awayTeam}</strong>?
              <br/><br/>
              Esta acción es <strong style={{ color: '#ef4444' }}>irreversible</strong> y eliminará:
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
                  borderRadius: '10px',
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
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '12px 24px',
                  borderRadius: '10px',
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

// Componente mejorado para cada partido
function MatchCard({ 
  match, 
  isEditing, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onStatusChange, 
  bulkMode 
}) {
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
      background: isSelected 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
        : 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '20px',
      border: isSelected 
        ? '2px solid rgba(16, 185, 129, 0.6)' 
        : '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Checkbox de selección */}
      {bulkMode && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10
        }}>
          <button
            onClick={onToggleSelect}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: `2px solid ${isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}`,
              background: isSelected ? '#10b981' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isSelected ? '✓' : ''}
          </button>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        marginLeft: bulkMode ? '40px' : '0'
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
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, awayTeam: e.target.value }))}
                  placeholder="Equipo Visitante"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#374151',
                    fontSize: '14px'
                  }}
                />
              </div>
              <input
                type="text"
                value={formData.league}
                onChange={(e) => setFormData(prev => ({ ...prev, league: e.target.value }))}
                placeholder="Liga/Competición"
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#374151',
                  fontSize: '14px'
                }}
              />
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#374151',
                  fontSize: '14px'
                }}
              />
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {match.league}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
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
              </div>
              
              <h4 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 12px 0',
                lineHeight: '1.2'
              }}>
                {match.homeTeam} <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '18px' }}>vs</span> {match.awayTeam}
              </h4>
              
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📅 {formatMatchDate(match.date)}
                </div>
                {match.homeScore !== null && match.awayScore !== null && (
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📊 Resultado: {match.homeScore} - {match.awayScore}
                  </div>
                )}
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🆔 {match.id}</span>
                  <span>•</span>
                  <span>📝 {match.source || 'manual'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
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
                  borderRadius: '8px',
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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ✏️ Editar
              </button>
              
              <select
                value={match.status}
                onChange={(e) => onStatusChange(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#374151',
                  fontSize: '11px',
                  fontWeight: '500'
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
                  borderRadius: '8px',
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