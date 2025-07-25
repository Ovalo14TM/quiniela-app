// src/components/admin/CreateQuiniela.jsx
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
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    loadAvailableMatches();
    setDefaultDeadline();
  }, []);

  useEffect(() => {
    setTitle(`Semana ${weekNumber} - ${year}`);
  }, [weekNumber, year]);

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

  const setDefaultDeadline = () => {
    // Establecer deadline para mañana a las 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    
    const deadlineString = tomorrow.toISOString().slice(0, 16);
    setDeadline(deadlineString);
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

    if (!deadline) {
      alert('Establece una fecha límite para las predicciones');
      return;
    }

    setCreating(true);
    try {
      const quinielaData = {
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        title,
        matches: Array.from(selectedMatches),
        deadline: new Date(deadline),
        createdBy: currentUser.uid
      };

      await createWeeklyQuiniela(quinielaData);
      
      alert('¡Quiniela creada exitosamente!');
      
      // Reset form
      setSelectedMatches(new Set());
      setWeekNumber(getCurrentWeekNumber());
      setYear(new Date().getFullYear());
      setDefaultDeadline();
      
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando partidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ➕ Crear Nueva Quiniela
        </h3>
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semana
            </label>
            <input
              type="number"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              min="1"
              max="53"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2024"
              max="2030"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (Fecha límite)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título de la Quiniela
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Semana 30 - 2025"
          />
        </div>
      </div>

      {/* Match Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-semibold text-gray-800">
            ⚽ Seleccionar Partidos ({availableMatches.length} disponibles)
          </h4>
          
          <div className="flex gap-2">
            <button
              onClick={selectAllMatches}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
            >
              {selectedMatches.size === availableMatches.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          </div>
        </div>

        {availableMatches.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-600">No hay partidos disponibles</p>
            <p className="text-sm text-gray-500">Primero importa partidos en la sección "Gestión de Partidos"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedMatches.size === availableMatches.length && availableMatches.length > 0}
                      onChange={selectAllMatches}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Partido</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Liga</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availableMatches.map((match) => (
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
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{match.league}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {selectedMatches.size} partidos seleccionados
            </p>
            {deadline && (
              <p className="text-xs text-gray-500">
                Deadline: {new Date(deadline).toLocaleString('es-MX')}
              </p>
            )}
          </div>
          
          <button
            onClick={handleCreateQuiniela}
            disabled={creating || selectedMatches.size === 0}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? '⏳ Creando...' : '🏆 Crear Quiniela'}
          </button>
        </div>
      </div>
    </div>
  );
}