// src/components/Rankings.jsx
import React, { useState, useEffect } from 'react';
import { getGlobalStats, getQuinielasHistory, getUserDetailedStats } from '../services/rankingsService';
import { useAuth } from '../context/AuthContext';

export default function Rankings() {
  const { currentUser } = useAuth();
  const [globalStats, setGlobalStats] = useState([]);
  const [quinielasHistory, setQuinielasHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stats, history] = await Promise.all([
        getGlobalStats(),
        getQuinielasHistory()
      ]);
      
      setGlobalStats(stats);
      setQuinielasHistory(history);
    } catch (error) {
      console.error('Error loading rankings data:', error);
    }
    setLoading(false);
  };

  const loadUserDetails = async (userId) => {
    try {
      const details = await getUserDetailedStats(userId);
      setUserDetails(details);
      setSelectedUser(userId);
      setActiveTab('userDetails');
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const TabButton = ({ tabId, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando rankings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Navegación */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🏆 Rankings y Estadísticas
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <TabButton
            tabId="global"
            label="🌐 Ranking Global"
            isActive={activeTab === 'global'}
            onClick={setActiveTab}
          />
          <TabButton
            tabId="history"
            label="📚 Historial"
            isActive={activeTab === 'history'}
            onClick={setActiveTab}
          />
          {userDetails && (
            <TabButton
              tabId="userDetails"
              label={`👤 ${userDetails.user.name}`}
              isActive={activeTab === 'userDetails'}
              onClick={setActiveTab}
            />
          )}
        </div>
      </div>

      {/* Ranking Global */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          {/* Podium */}
          {globalStats.length >= 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                🏆 Podium de Campeones
              </h3>
              
              <div className="flex justify-center items-end space-x-4">
                {/* Segundo Lugar */}
                <div className="text-center">
                  <div className="w-20 h-16 bg-gray-400 rounded-t-lg flex items-end justify-center text-white font-bold">
                    🥈
                  </div>
                  <div className="bg-gray-100 p-3 rounded-b-lg">
                    <div className="font-semibold text-sm">{globalStats[1]?.name}</div>
                    <div className="text-xs text-gray-600">{globalStats[1]?.totalPoints} pts</div>
                  </div>
                </div>

                {/* Primer Lugar */}
                <div className="text-center">
                  <div className="w-24 h-20 bg-yellow-500 rounded-t-lg flex items-end justify-center text-white font-bold text-lg">
                    🥇
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-b-lg">
                    <div className="font-bold">{globalStats[0]?.name}</div>
                    <div className="text-sm text-yellow-700">{globalStats[0]?.totalPoints} pts</div>
                    <div className="text-xs text-yellow-600">👑 Campeón</div>
                  </div>
                </div>

                {/* Tercer Lugar */}
                <div className="text-center">
                  <div className="w-20 h-12 bg-orange-600 rounded-t-lg flex items-end justify-center text-white font-bold">
                    🥉
                  </div>
                  <div className="bg-orange-100 p-3 rounded-b-lg">
                    <div className="font-semibold text-sm">{globalStats[2]?.name}</div>
                    <div className="text-xs text-gray-600">{globalStats[2]?.totalPoints} pts</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla Completa de Rankings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Ranking Completo
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Pos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Jugador</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Puntos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Precisión</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Exactos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ganancias</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {globalStats.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-50 ${user.id === currentUser?.uid ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.name}
                              {user.id === currentUser?.uid && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.quinielasWon} quinielas ganadas
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {user.totalPoints}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.accuracy.toFixed(1)}%
                        <div className="text-xs text-gray-500">
                          {user.correctPredictions}/{user.totalPredictions}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="font-semibold text-green-600">
                          {user.exactScores}
                        </span>
                        <div className="text-xs text-gray-500">
                          {user.totalPredictions > 0 ? ((user.exactScores / user.totalPredictions) * 100).toFixed(1) : 0}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className={user.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${user.totalWinnings} MXN
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadUserDetails(user.id)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          📊 Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Quinielas */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📚 Historial de Quinielas
          </h3>
          
          <div className="space-y-4">
            {quinielasHistory.map((quiniela) => (
              <div key={quiniela.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {quiniela.title}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📅 {quiniela.createdAt?.toDate?.()?.toLocaleDateString('es-MX') || 'Fecha no disponible'}</div>
                      <div>👥 {quiniela.totalParticipants} participantes</div>
                      <div>🎯 {quiniela.totalPredictions} predicciones</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      quiniela.status === 'finished' ? 'bg-green-100 text-green-800' :
                      quiniela.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {quiniela.status === 'finished' ? '✅ Terminada' :
                       quiniela.status === 'closed' ? '🔒 Cerrada' : '🔄 Activa'}
                    </div>
                    
                    {quiniela.winners.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium text-gray-900">
                          🏆 Ganadores:
                        </div>
                        {quiniela.winners.map(winnerId => {
                          const winner = globalStats.find(u => u.id === winnerId);
                          return (
                            <div key={winnerId} className="text-green-600">
                              👑 {winner?.name || `Usuario ${winnerId.slice(-6)}`}
                            </div>
                          );
                        })}
                        <div className="text-xs text-gray-500">
                          Puntaje: {quiniela.topScore} pts
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Ranking de esa quiniela */}
                {quiniela.ranking.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      📊 Ranking Final:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {quiniela.ranking.slice(0, 3).map((userRank, index) => {
                        const userData = globalStats.find(u => u.id === userRank.userId);
                        return (
                          <div key={userRank.userId} className="flex justify-between">
                            <span>
                              {index + 1}. {userData?.name || `Usuario ${userRank.userId.slice(-6)}`}
                            </span>
                            <span className="font-medium">{userRank.totalPoints} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {quinielasHistory.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-600">No hay historial de quinielas aún</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalles de Usuario */}
      {activeTab === 'userDetails' && userDetails && (
        <UserDetailsView 
          userDetails={userDetails} 
          onBack={() => setActiveTab('global')} 
        />
      )}
    </div>
  );
}

// Componente para mostrar detalles de un usuario
function UserDetailsView({ userDetails, onBack }) {
  if (!userDetails || !userDetails.user) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-600">Error cargando detalles del usuario</p>
          <button
            onClick={onBack}
            className="mt-4 text-blue-500 hover:text-blue-700 font-medium"
          >
            ← Volver al Ranking
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, quinielaStats, monthlyStats, pointsDistribution } = userDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              👤 {user.name}
            </h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            ← Volver al Ranking
          </button>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalPoints}</div>
            <div className="text-sm text-gray-600">Puntos Totales</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Precisión</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.exactScores}</div>
            <div className="text-sm text-gray-600">Resultados Exactos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{user.quinielasWon}</div>
            <div className="text-sm text-gray-600">Quinielas Ganadas</div>
          </div>
        </div>

        {/* Gráfico de Distribución de Puntos */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Distribución de Puntos por Predicción
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(pointsDistribution).map(([points, count]) => {
              const total = Object.values(pointsDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={points} className="text-center">
                  <div className="bg-gray-200 rounded-lg p-3 mb-2">
                    <div className={`h-20 rounded flex items-end justify-center text-white font-bold ${
                      points === '0' ? 'bg-red-500' :
                      points === '1' ? 'bg-yellow-500' :
                      points === '2' ? 'bg-blue-500' :
                      points === '3' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} style={{ height: `${Math.max(percentage, 10)}%` }}>
                      {count}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{points} pts</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rendimiento por Quiniela */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Rendimiento por Quiniela
        </h4>
        
        {quinielaStats.length > 0 ? (
          <div className="space-y-3">
            {quinielaStats.map((quiniela, index) => (
              <div key={quiniela.quinielaId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Quiniela #{index + 1}</div>
                  <div className="text-sm text-gray-600">
                    {quiniela.predictions} predicciones • {quiniela.correctPredictions} acertadas
                    {quiniela.exactScores > 0 && ` • ${quiniela.exactScores} exactas`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{quiniela.totalPoints} pts</div>
                  <div className="text-xs text-gray-500">
                    {quiniela.predictions > 0 ? (quiniela.totalPoints / quiniela.predictions).toFixed(1) : 0} promedio
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">No hay datos de quinielas aún</p>
          </div>
        )}
      </div>

      {/* Estadísticas Mensuales */}
      {monthlyStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Progreso Mensual
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyStats.map((month) => (
              <div key={month.month} className="border border-gray-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{month.month}</div>
                  <div className="text-2xl font-bold text-blue-600 my-2">{month.totalPoints}</div>
                  <div className="text-sm text-gray-600">
                    {month.predictions} predicciones
                  </div>
                  {month.exactScores > 0 && (
                    <div className="text-xs text-green-600">
                      {month.exactScores} exactas
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mejor y Peor Quiniela */}
      {userDetails.bestQuiniela && userDetails.worstQuiniela && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-800 mb-4">
              🏆 Mejor Quiniela
            </h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {userDetails.bestQuiniela.totalPoints} pts
              </div>
              <div className="text-sm text-green-700">
                {userDetails.bestQuiniela.correctPredictions}/{userDetails.bestQuiniela.predictions} acertadas
              </div>
              {userDetails.bestQuiniela.exactScores > 0 && (
                <div className="text-sm text-green-600">
                  {userDetails.bestQuiniela.exactScores} resultados exactos
                </div>
              )}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-red-800 mb-4">
              📉 Quiniela Más Difícil
            </h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {userDetails.worstQuiniela.totalPoints} pts
              </div>
              <div className="text-sm text-red-700">
                {userDetails.worstQuiniela.correctPredictions}/{userDetails.worstQuiniela.predictions} acertadas
              </div>
              <div className="text-xs text-red-600 mt-1">
                Todos tenemos días difíciles 😅
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}