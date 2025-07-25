// src/components/admin/MatchesManagement.jsx
import React, { useState, useEffect } from 'react';
import { getAvailableMatches, formatMatchDate, formatMatchScore } from '../../services/footballService';
import { saveMultipleMatches, getAllAvailableMatches } from '../../services/matchesService';

export default function MatchesManagement() {
  const [apiMatches, setApiMatches] = useState([]);
  const [savedMatches, setSavedMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState(new Set());

  useEffect(() => {
    loadSavedMatches();
  }, []);

  const loadApiMatches = async () => {
    setLoading(true);
    try {
      const matches = await getAvailableMatches();
      setApiMatches(matches);
    } catch (error) {
      console.error('Error loading API matches:', error);
    }
    setLoading(false);
  };

  const loadSavedMatches = async () => {
    try {
      const matches = await getAllAvailableMatches();
      setSavedMatches(matches);
    } catch (error) {
      console.error('Error loading saved matches:', error);
    }
  };

  const handleImportMatches = async () => {
    if (selectedMatches.size === 0) {
      alert('Selecciona al menos un partido para importar');
      return;
    }

    setImporting(true);
    try {
      const matchesToImport = apiMatches.filter(match => selectedMatches.has(match.id));
      const success = await saveMultipleMatches(matchesToImport);
      
      if (success) {
        alert(`${matchesToImport.length} partidos importados correctamente`);
        setSelectedMatches(new Set());
        loadSavedMatches();
      } else {
        alert('Error al importar partidos');
      }
    } catch (error) {
      console.error('Error importing matches:', error);
      alert('Error al importar partidos');
    }
    setImporting(false);
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
    if (selectedMatches.size === apiMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(apiMatches.map(match => match.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ⚽ Gestión de Partidos
          </h3>
          <p className="text-sm text-gray-600">
            Importa partidos desde APIs o añádelos manualmente
          </p>
        </div>
        
        <button
          onClick={loadApiMatches}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '🔄 Cargando...' : '🔍 Buscar Partidos'}
        </button>
      </div>

      {/* Partidos de API */}
      {apiMatches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-gray-800">
              📡 Partidos Disponibles ({apiMatches.length})
            </h4>
            
            <div className="flex gap-2">
              <button
                onClick={selectAllMatches}
                className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
              >
                {selectedMatches.size === apiMatches.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </button>
              
              <button
                onClick={handleImportMatches}
                disabled={importing || selectedMatches.size === 0}
                className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {importing ? '⏳ Importando...' : `📥 Importar (${selectedMatches.size})`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedMatches.size === apiMatches.length && apiMatches.length > 0}
                      onChange={selectAllMatches}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Partido</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Liga</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fuente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedMatches.has(match.id)}
                        onChange={() => toggleMatchSelection(match.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="font-medium">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {formatMatchScore(match.homeScore, match.awayScore)}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{match.league}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {formatMatchDate(match.date)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        match.source === 'manual' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {match.source === 'manual' ? '✍️ Manual' : '🌐 API'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partidos Guardados */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-semibold text-gray-800">
            💾 Partidos Guardados ({savedMatches.length})
          </h4>
          
          <button
            onClick={loadSavedMatches}
            className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>

        {savedMatches.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-600">No hay partidos guardados</p>
            <p className="text-sm text-gray-500">Importa partidos desde APIs o añádelos manualmente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Partido</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Liga</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savedMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="font-medium">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {formatMatchScore(match.homeScore, match.awayScore)}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{match.league}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {formatMatchDate(match.date)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'FINISHED'
                          ? 'bg-green-100 text-green-800'
                          : match.status === 'LIVE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status === 'FINISHED' ? '✅ Terminado' :
                         match.status === 'LIVE' ? '🟡 En Vivo' : '⏳ Programado'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Botón para añadir partido manualmente */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <h4 className="text-md font-semibold text-gray-800 mb-2">
            ✍️ Añadir Partido Manualmente
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Si no encuentras un partido en las APIs, puedes añadirlo manualmente
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
            ➕ Nuevo Partido
          </button>
        </div>
      </div>
    </div>
  );
}