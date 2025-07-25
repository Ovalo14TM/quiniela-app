// src/services/footballService.js

// API URLs y configuración
const FOOTBALL_DATA_URL = 'https://api.football-data.org/v4';
const API_SPORTS_URL = 'https://v3.football.api-sports.io';

// Obtener partidos desde Football-Data.org
export const getMatchesFromFootballData = async () => {
  try {
    const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
    if (!apiKey) {
      console.log('No API key for Football-Data.org');
      return [];
    }

    // Obtener partidos de las principales ligas
    const leagues = [
      'PL', // Premier League
      'PD', // La Liga
      'SA', // Serie A
      'BL1', // Bundesliga
      'FL1', // Ligue 1
    ];

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const allMatches = [];

    for (const league of leagues) {
      const response = await fetch(
        `${FOOTBALL_DATA_URL}/competitions/${league}/matches?dateFrom=${today.toISOString().split('T')[0]}&dateTo=${nextWeek.toISOString().split('T')[0]}`,
        {
          headers: {
            'X-Auth-Token': apiKey
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const matches = data.matches.map(match => ({
          id: `fd_${match.id}`,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          league: match.competition.name,
          date: new Date(match.utcDate),
          source: 'football-data',
          apiId: match.id.toString(),
          status: match.status,
          homeScore: match.score?.fullTime?.home || null,
          awayScore: match.score?.fullTime?.away || null
        }));
        allMatches.push(...matches);
      }
    }

    return allMatches;
  } catch (error) {
    console.error('Error fetching from Football-Data.org:', error);
    return [];
  }
};

// Obtener partidos desde API-Sports (respaldo)
export const getMatchesFromApiSports = async () => {
  try {
    const apiKey = import.meta.env.VITE_API_SPORTS_KEY;
    if (!apiKey) {
      console.log('No API key for API-Sports');
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${API_SPORTS_URL}/fixtures?date=${today}&league=39,140,135,78,61`, // Premier, La Liga, Serie A, Bundesliga, Ligue 1
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.response.map(match => ({
        id: `as_${match.fixture.id}`,
        homeTeam: match.teams.home.name,
        awayTeam: match.teams.away.name,
        league: match.league.name,
        date: new Date(match.fixture.date),
        source: 'api-sports',
        apiId: match.fixture.id.toString(),
        status: match.fixture.status.short,
        homeScore: match.goals.home,
        awayScore: match.goals.away
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching from API-Sports:', error);
    return [];
  }
};

// Partidos de muestra para desarrollo/demo
export const getSampleMatches = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0); // 3:00 PM
  
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  dayAfter.setHours(18, 0, 0, 0); // 6:00 PM

  const thirdDay = new Date(today);
  thirdDay.setDate(today.getDate() + 3);
  thirdDay.setHours(20, 0, 0, 0); // 8:00 PM

  return [
    {
      id: 'sample_1',
      homeTeam: 'Real Madrid',
      awayTeam: 'FC Barcelona',
      league: 'La Liga',
      date: tomorrow,
      source: 'manual',
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null
    },
    {
      id: 'sample_2', 
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      league: 'Premier League',
      date: tomorrow,
      source: 'manual',
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null
    },
    {
      id: 'sample_3',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      league: 'Bundesliga', 
      date: dayAfter,
      source: 'manual',
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null
    },
    {
      id: 'sample_4',
      homeTeam: 'Juventus',
      awayTeam: 'AC Milan',
      league: 'Serie A',
      date: thirdDay,
      source: 'manual',
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null
    },
    {
      id: 'sample_5',
      homeTeam: 'PSG',
      awayTeam: 'Olympique Marseille',
      league: 'Ligue 1',
      date: thirdDay,
      source: 'manual',
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null
    }
  ];
};

// Función principal para obtener partidos
export const getAvailableMatches = async () => {
  try {
    // Intentar primero con Football-Data.org
    let matches = await getMatchesFromFootballData();
    
    // Si no hay partidos, intentar con API-Sports
    if (matches.length === 0) {
      matches = await getMatchesFromApiSports();
    }
    
    // Si aún no hay partidos, usar datos de muestra
    if (matches.length === 0) {
      console.log('No API data available, using sample matches');
      matches = getSampleMatches();
    }

    // Filtrar solo partidos futuros y ordenar por fecha
    const futureMatches = matches
      .filter(match => new Date(match.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 20); // Limitar a 20 partidos

    return futureMatches;
  } catch (error) {
    console.error('Error getting matches:', error);
    return getSampleMatches();
  }
};

// Formatear fecha para mostrar
export const formatMatchDate = (date) => {
  try {
    // Manejar diferentes tipos de fecha
    let dateObj;
    
    if (!date) {
      return 'Fecha no disponible';
    }
    
    // Si es un timestamp de Firestore
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } 
    // Si es una fecha normal
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Si es un string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Si es un número (timestamp)
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      return 'Fecha inválida';
    }
    
    // Verificar que la fecha sea válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
    
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Error en fecha';
  }
};

// Formatear resultado del partido
export const formatMatchScore = (homeScore, awayScore) => {
  if (homeScore === null || awayScore === null) {
    return 'vs';
  }
  return `${homeScore} - ${awayScore}`;
};