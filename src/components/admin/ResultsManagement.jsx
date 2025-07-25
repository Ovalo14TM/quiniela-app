// src/components/admin/ResultsManagement.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getCurrentQuiniela } from '../../services/quinielaService';
import { updateMatchResult, calculateQuinielaStats, determineQuinielaWinners } from '../../services/scoringService';
import { createPaymentsFromQuiniela } from '../../services/paymentsService';
import { formatMatchDate } from '../../services/footballService';

export default function ResultsManagement() {
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [quinielaStats, setQuinielaStats] = useState(null);
  const [winners, setWinners] = useState(null);

  useEffect(() => {
    loadCurrentQuiniela();
  }, []);

  const loadCurrentQuiniela = async () => {
    setLoading(true);
    try {
      const quiniela = await getCurrentQuiniela();
      
      if (quiniela) {
        setCurrentQuiniela(quiniela);
        
        // Cargar partidos de la quiniela
        const quinielaMatches = await Promise.all(
          quiniela.matches.map(async (matchId) => {
            const matchRef = doc(db, 'matches', matchId);
            const matchSnap = await getDoc(matchRef);
            
            if (matchSnap.exists()) {
              return { id: matchSnap.id, ...matchSnap.data() };
            }
            return null;
          })
        );
        
        const validMatches = quinielaMatches.filter(match => match != null);
        setMatches(validMatches);
        
        // Cargar estadísticas si hay partidos terminados
        const stats = await calculateQuinielaStats(quiniela.id);
        setQuinielaStats(stats);
        
        // Calcular ganadores si todos los partidos están terminados
        const allFinished = validMatches.every(match => match.status === 'FINISHED');
        if (allFinished && validMatches.length > 0) {
          const winnersData = await determineQuinielaWinners(quiniela.id);
          setWinners(winnersData);
          
          // Crear pagos automáticamente si hay ganadores
          if (winnersData.winners.length > 0) {
            await createPaymentsFromQuiniela(quiniela.id, winnersData.winners, winnersData.ranking);
            console.log('💰 Pagos creados automáticamente para la quiniela');
          }
        }
      }
    } catch (error) {
      console.error('Error loading current quiniela:', error);
    }
    setLoading(false);
  };

  const handleUpdateResult = async (matchId, homeScore, awayScore) => {
    if (homeScore === '' || awayScore === '' || homeScore < 0 || awayScore < 0) {
      alert('Por favor ingresa resultados válidos');
      return;
    }

    setUpdating(matchId);
    try {
      const result = await updateMatchResult(matchId, homeScore, awayScore);
      
      alert(`✅ Resultado actualizado!\n📊 ${result.predictionsUpdated} predicciones calculadas\n👥 ${result.usersAffected} usuarios afectados`);
      
      // Recargar datos
      await loadCurrentQuiniela();
      
    } catch (error) {
      console.error('Error updating result:', error);
      alert('Error al actualizar el resultado');
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando quiniela...</p>
      </div>
    );
  }

  if (!currentQuiniela) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay quiniela activa
          </h3>
          <p className="text-gray-600">
            Primero crea una quiniela para gestionar resultados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Gestión de Resultados
            </h3>
            <p className="text-sm text-gray-600">
              {currentQuiniela.title} - {matches.length} partidos
            </p>
          </div>
          
          <button
            onClick={loadCurrentQuiniela}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ 
              width: `${matches.length > 0 ? (matches.filter(m => m.status === 'FINISHED').length / matches.length) * 100 : 0}%` 
            }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {matches.filter(m => m.status === 'FINISHED').length} de {matches.length} partidos completados
        </p>
      </div>

      {/* Lista de Partidos */}
      <div className="space-y-4">
        {matches.map((match, index) => (
          <MatchResultCard
            key={match.id}
            match={match}
            index={index}
            onUpdateResult={handleUpdateResult}
            updating={updating === match.id}
          />
        ))}
      </div>

      {/* Estadísticas de la Quiniela */}
      {quinielaStats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Estadísticas Actuales
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {quinielaStats.totalUsers}
              </div>
              <div className="text-sm text-gray-600">Participantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {quinielaStats.totalPredictions}
              </div>
              <div className="text-sm text-gray-600">Predicciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {quinielaStats.userRanking[0]?.totalPoints || 0}
              </div>
              <div className="text-sm text-gray-600">Puntaje Líder</div>
            </div>
          </div>

          {/* Ranking Actual */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Posición</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Usuario</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Puntos</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Precisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quinielaStats.userRanking.map((user, index) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      Usuario {user.userId.slice(-6)}
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {user.totalPoints}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {user.predictions > 0 ? `${user.correctResults}/${user.predictions}` : '0/0'}
                      {user.exactScores > 0 && (
                        <span className="ml-2 text-green-600">
                          ({user.exactScores} exactos)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ganadores y Pagos */}
      {winners && winners.winners.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Ganadores y Pagos
          </h4>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h5 className="font-semibold text-green-800 mb-2">
              🎉 ¡Ganadores de la Quiniela!
            </h5>
            <div className="space-y-1">
              {winners.winners.map(winner => (
                <div key={winner.userId} className="text-green-700">
                  👑 Usuario {winner.userId.slice(-6)} - {winner.totalPoints} puntos
                </div>
              ))}
            </div>
          </div>

          {winners.payments.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-800 mb-2">
                💰 Pagos a Realizar
              </h5>
              <div className="space-y-2">
                {winners.payments.map((payment, index) => (
                  <div key={index} className="text-blue-700 text-sm">
                    💸 Usuario {payment.from.slice(-6)} debe pagar ${payment.amount} MXN a Usuario {payment.to.slice(-6)}
                    <span className="text-blue-600 ml-2">({payment.reason})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para cada partido
function MatchResultCard({ match, index, onUpdateResult, updating }) {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '');

  const isFinished = match.status === 'FINISHED';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Info del Partido */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
              #{index + 1}
            </span>
            <span className="text-sm text-gray-500">{match.league}</span>
            {isFinished && (
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                ✅ Terminado
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {match.homeTeam} vs {match.awayTeam}
          </h3>
          
          <p className="text-sm text-gray-600">
            📅 {formatMatchDate(match.date)}
          </p>
        </div>

        {/* Formulario de Resultado */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {match.homeTeam.split(' ').slice(-1)[0]}
              </div>
              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={isFinished}
                className="w-16 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0"
              />
            </div>
            
            <div className="text-2xl font-bold text-gray-400">-</div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {match.awayTeam.split(' ').slice(-1)[0]}
              </div>
              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={isFinished}
                className="w-16 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0"
              />
            </div>
          </div>

          {/* Botón de Actualizar */}
          {!isFinished && (
            <button
              onClick={() => onUpdateResult(match.id, homeScore, awayScore)}
              disabled={updating || homeScore === '' || awayScore === ''}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? '⏳ Actualizando...' : '✅ Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}