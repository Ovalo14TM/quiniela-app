// src/components/admin/AdminUserManagement.jsx - CRUD completo de usuarios
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
import { getAllUsers } from '../../services/userService';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const handleEditUser = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      alert('✅ Usuario actualizado correctamente');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('❌ Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      // 1. Verificar si tiene predicciones activas
      const predictionsQuery = query(
        collection(db, 'predictions'),
        where('userId', '==', userId)
      );
      const predictions = await getDocs(predictionsQuery);
      
      if (!predictions.empty) {
        const confirm = window.confirm(
          '⚠️ Este usuario tiene predicciones activas.\n' +
          'Eliminar el usuario también eliminará:\n' +
          `• ${predictions.size} predicciones\n` +
          '• Su historial completo\n\n' +
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
      
      // 2. Verificar pagos pendientes
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('fromUser', '==', userId)
      );
      const payments = await getDocs(paymentsQuery);
      
      if (!payments.empty) {
        const pendingPayments = payments.docs.filter(doc => 
          doc.data().status === 'pending'
        );
        
        if (pendingPayments.length > 0) {
          alert('❌ No se puede eliminar: tiene pagos pendientes');
          return;
        }
      }
      
      // 3. Eliminar usuario
      await deleteDoc(doc(db, 'users', userId));
      
      alert('✅ Usuario eliminado correctamente');
      setShowDeleteModal(null);
      loadUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Error al eliminar usuario');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const confirm = window.confirm(
      `¿Cambiar rol de ${currentRole} a ${newRole}?`
    );
    
    if (confirm) {
      await handleEditUser(userId, { role: newRole });
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    const newStatus = !isActive;
    
    await handleEditUser(userId, { 
      isActive: newStatus,
      suspendedAt: newStatus ? null : new Date()
    });
  };

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
        <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cargando usuarios...</p>
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
            👥 Gestión de Usuarios
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0
          }}>
            Administrar usuarios del sistema ({users.length} total)
          </p>
        </div>
        
        <button
          onClick={loadUsers}
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

      {/* Tabla de Usuarios */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold' }}>Usuario</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold' }}>Rol</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold' }}>Estadísticas</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {/* Usuario Info */}
                <td style={{ padding: '16px' }}>
                  {editingUser === user.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        defaultValue={user.name}
                        placeholder="Nombre"
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: '#374151'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditUser(user.id, { name: e.target.value });
                          }
                        }}
                      />
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {user.email}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {user.email}
                      </div>
                    </div>
                  )}
                </td>

                {/* Rol */}
                <td style={{ padding: '16px' }}>
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    style={{
                      background: user.role === 'admin' 
                        ? 'rgba(139, 92, 246, 0.2)' 
                        : 'rgba(16, 185, 129, 0.2)',
                      color: user.role === 'admin' ? '#a855f7' : '#10b981',
                      border: `1px solid ${user.role === 'admin' 
                        ? 'rgba(139, 92, 246, 0.4)' 
                        : 'rgba(16, 185, 129, 0.4)'}`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                  </button>
                </td>

                {/* Estado */}
                <td style={{ padding: '16px' }}>
                  <button
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    style={{
                      background: user.isActive 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(239, 68, 68, 0.2)',
                      color: user.isActive ? '#10b981' : '#ef4444',
                      border: `1px solid ${user.isActive 
                        ? 'rgba(16, 185, 129, 0.4)' 
                        : 'rgba(239, 68, 68, 0.4)'}`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {user.isActive ? '✅ Activo' : '❌ Suspendido'}
                  </button>
                </td>

                {/* Estadísticas */}
                <td style={{ padding: '16px', fontSize: '14px' }}>
                  <div>🏆 {user.totalPoints || 0} pts</div>
                  <div>💰 ${user.totalWinnings || 0}</div>
                  <div>🎯 {user.quinielasWon || 0} ganadas</div>
                </td>

                {/* Acciones */}
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {editingUser === user.id ? (
                      <>
                        <button
                          onClick={() => setEditingUser(null)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ Guardar
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          style={{
                            background: 'rgba(156, 163, 175, 0.2)',
                            color: '#9ca3af',
                            border: '1px solid rgba(156, 163, 175, 0.4)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUser(user.id)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(user)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              ¿Estás seguro de eliminar al usuario <strong>{showDeleteModal.name}</strong>?
              <br/><br/>
              Esta acción es <strong>irreversible</strong> y eliminará:
              <br/>• Todas sus predicciones
              <br/>• Su historial completo
              <br/>• Sus configuraciones
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
                onClick={() => handleDeleteUser(showDeleteModal.id)}
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
                🗑️ Eliminar Usuario
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