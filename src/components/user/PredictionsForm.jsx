// src/components/user/PredictionsForm.jsx
import React, { useState, useEffect } from 'react';
import { getCurrentQuiniela, isQuinielaOpen, getTimeUntilDeadline } from '../../services/quinielaService';
import { getMatchesByWeek } from '../../services/matchesService';
import { getUserPredictionsForQuiniela, savePrediction } from '../../services/predictionsService';
import { formatMatchDate } from '../../services/footballService';
import { useAuth } from '../../context/AuthContext';

export default function PredictionsForm() {
  const { currentUser } = useAuth();
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    loadCurrentQuiniela();
  }, []);

  useEffect(() => {
    // Actualizar contador cada minuto
    const interval = setInterval(() => {
      if (currentQuiniela?.deadline) {
        const time = getTimeUntilDeadline(currentQuiniela.deadline);
        setTimeLeft(time);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentQuiniela]);

  const loadCurrentQuiniela = async () => {
    setLoading(true);
    try {
      const quiniela = await getCurrentQuiniela();
      
      if (quiniela) {
        setCurrentQuiniela(quiniela);
        
        // Cargar partidos de la quiniela
        const quinielaMatches = await Promise.all(
          quiniela.matches.map(async (matchId) => {
            const matchesFromWeek = await getMatchesByWeek(quiniela.id);
            return matchesFromWeek.find(m => m.id === matchId);
          })
        );
        
        // Filtrar matches válidos
        const validMatches = quinielaMatches.filter(match => match != null);
        setMatches(validMatches);
        
        // Cargar predicciones existentes del usuario
        const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, quiniela.id);
        setPredictions(userPredictions);
        
        // Calcular tiempo restante
        const time = getTimeUntilDeadline(quiniela.deadline);
        setTimeLeft(time);
      }
    } catch (error) {
      console.error('Error loading current quiniela:', error);
    }
    setLoading(false);
  };

  const handlePredictionChange = (matchId, field, value) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const savePredictionForMatch = async (matchId) => {
    const prediction = predictions[matchId];
    
    if (!prediction || prediction.homeScore === undefined || prediction.awayScore === undefined) {
      alert('Por favor completa ambos marcadores');
      return;
    }

    if (prediction.homeScore < 0 || prediction.awayScore < 0) {
      alert('Los marcadores no pueden ser negativos');
      return;
    }

    setSaving(true);
    try {
      await savePrediction({
        userId: currentUser.uid,
        matchId,
        quinielaId: currentQuiniela.id,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore
      });
      
      alert('Predicción guardada correctamente');
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Error al guardar la predicción');
    }
    setSaving(false);
  };

  const saveAllPredictions = async () => {
    const incompletePredictions = matches.filter(match => 
      !predictions[match.id] || 
      predictions[match.id].homeScore === undefined || 
      predictions[match.id].awayScore === undefined
    );

    if (incompletePredictions.length > 0) {
      alert(`Faltan ${incompletePredictions.length} predicciones por completar`);
      return;
    }

    setSaving(true);
    try {
      const savePromises = matches.map(match => 
        savePrediction({
          userId: currentUser.uid,
          matchId: match.id,
          quinielaId: currentQuiniela.id,
          homeScore: predictions[match.id].homeScore,
          awayScore: predictions[match.id].awayScore
        })
      );

      await Promise.all(savePromises);
      alert('¡Todas las predicciones guardadas correctamente!');
      
      // Recargar predicciones
      const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, currentQuiniela.id);
      setPredictions(userPredictions);
    } catch (error) {
      console.error('Error saving all predictions:', error);
      alert('Error al guardar las predicciones');
    }
    setSaving(false);
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
            El administrador aún no ha creado la quiniela de esta semana
          </p>
        </div>
      </div>
    );
  }

  const isOpen = isQuinielaOpen(currentQuiniela);
  const completedPredictions = Object.keys(predictions).length;
  const totalPredictions = matches.length;

  return (
    <div className="space-y-6">
      {/* Header de la Quiniela */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🏆 {currentQuiniela.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>📅 {matches.length} partidos</span>
              <span>✅ {completedPredictions}/{totalPredictions} completadas</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-lg font-semibold ${timeLeft?.expired ? 'text-red-600' : 'text-green-600'}`}>
              ⏰ {timeLeft?.text || 'Calculando...'}
            </div>
            <div className="text-sm text-gray-600">
              {isOpen ? 'Tiempo restante' : 'Quiniela cerrada'}
            </div>
          </div>
        </div>
        
        {!isOpen && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ⚠️ Esta quiniela está cerrada. Ya no puedes modificar tus predicciones.
            </p>
          </div>
        )}
      </div>

      {/* Lista de Partidos */}
      <div className="space-y-4">
        {matches.map((match, index) => {
          const matchPrediction = predictions[match.id] || {};
          const hasValidPrediction = matchPrediction.homeScore !== undefined && matchPrediction.awayScore !== undefined;
          
          return (
            <div key={match.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Info del Partido */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-500">{match.league}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  
                  <p className="text-sm text-gray-600">
                    📅 {formatMatchDate(match.date)}
                  </p>
                </div>

                {/* Formulario de Predicción */}
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
                        value={matchPrediction.homeScore || ''}
                        onChange={(e) => handlePredictionChange(match.id, 'homeScore', parseInt(e.target.value) || '')}
                        disabled={!isOpen}
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
                        value={matchPrediction.awayScore || ''}
                        onChange={(e) => handlePredictionChange(match.id, 'awayScore', parseInt(e.target.value) || '')}
                        disabled={!isOpen}
                        className="w-16 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Estado de la Predicción */}
                  <div className="flex flex-col items-center gap-2">
                    {hasValidPrediction ? (
                      <span className="text-green-600 text-sm font-medium">
                        ✅ Guardada
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        ⏳ Pendiente
                      </span>
                    )}
                    
                    {isOpen && (
                      <button
                        onClick={() => savePredictionForMatch(match.id)}
                        disabled={saving || !predictions[match.id]?.homeScore === undefined}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        💾 Guardar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón para Guardar Todo */}
      {isOpen && matches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Guardar Todas las Predicciones
              </h3>
              <p className="text-sm text-gray-600">
                {completedPredictions}/{totalPredictions} predicciones completadas
              </p>
            </div>
            
            <button
              onClick={saveAllPredictions}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar Todo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}