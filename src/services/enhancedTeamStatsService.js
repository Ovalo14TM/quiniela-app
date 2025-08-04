// src/services/enhancedTeamStatsService.js - Estadísticas específicas para equipos de las APIs

const API_SPORTS_URL = 'https://v3.football.api-sports.io';

// 🏆 MAPEO DE LIGAS CON SUS IDs
const LEAGUE_MAPPING = {
  'Liga MX': { id: 262, season: 2024, country: 'Mexico' },
  'Leagues Cup': { id: 848, season: 2024, country: 'USA' }, // Verificar ID
  'Premier League': { id: 39, season: 2024, country: 'England' },
  'La Liga': { id: 140, season: 2024, country: 'Spain' },
  'Ligue 1': { id: 61, season: 2024, country: 'France' },
  'Serie A': { id: 135, season: 2024, country: 'Italy' },
  'Bundesliga': { id: 78, season: 2024, country: 'Germany' },
  'Champions League': { id: 2, season: 2024, country: 'World' }
};

// 🎯 EQUIPOS ESPECÍFICOS PARA DATOS DE MUESTRA
const TEAM_SAMPLE_DATA = {
  // Liga MX
  'América': {
    league: 'Liga MX',
    form: ['W', 'W', 'L', 'W', 'D'],
    lastMatches: [
      { date: '2025-01-28', opponent: 'Chivas', isHome: true, teamScore: 2, opponentScore: 1, result: 'W' },
      { date: '2025-01-24', opponent: 'Cruz Azul', isHome: false, teamScore: 3, opponentScore: 1, result: 'W' },
      { date: '2025-01-20', opponent: 'Pumas', isHome: true, teamScore: 1, opponentScore: 2, result: 'L' },
      { date: '2025-01-16', opponent: 'Santos', isHome: false, teamScore: 2, opponentScore: 0, result: 'W' },
      { date: '2025-01-12', opponent: 'Tigres', isHome: true, teamScore: 1, opponentScore: 1, result: 'D' }
    ]
  },
  'Chivas': {
    league: 'Liga MX',
    form: ['L', 'W', 'W', 'D', 'W'],
    lastMatches: [
      { date: '2025-01-28', opponent: 'América', isHome: false, teamScore: 1, opponentScore: 2, result: 'L' },
      { date: '2025-01-24', opponent: 'Monterrey', isHome: true, teamScore: 3, opponentScore: 0, result: 'W' },
      { date: '2025-01-20', opponent: 'León', isHome: false, teamScore: 2, opponentScore: 1, result: 'W' },
      { date: '2025-01-16', opponent: 'Atlas', isHome: true, teamScore: 0, opponentScore: 0, result: 'D' },
      { date: '2025-01-12', opponent: 'Toluca', isHome: false, teamScore: 2, opponentScore: 1, result: 'W' }
    ]
  },
  'Cruz Azul': {
    league: 'Liga MX',
    form: ['L', 'W', 'W', 'W', 'L'],
    lastMatches: [
      { date: '2025-01-27', opponent: 'América', isHome: true, teamScore: 1, opponentScore: 3, result: 'L' },
      { date: '2025-01-23', opponent: 'Pumas', isHome: false, teamScore: 2, opponentScore: 0, result: 'W' },
      { date: '2025-01-19', opponent: 'Tigres', isHome: true, teamScore: 3, opponentScore: 1, result: 'W' },
      { date: '2025-01-15', opponent: 'Pachuca', isHome: false, teamScore: 1, opponentScore: 0, result: 'W' },
      { date: '2025-01-11', opponent: 'Santos', isHome: true, teamScore: 0, opponentScore: 1, result: 'L' }
    ]
  },

  // Premier League
  'Manchester City': {
    league: 'Premier League',
    form: ['W', 'W', 'W', 'D', 'W'],
    lastMatches: [
      { date: '2025-01-29', opponent: 'Liverpool', isHome: true, teamScore: 2, opponentScore: 1, result: 'W' },
      { date: '2025-01-25', opponent: 'Arsenal', isHome: false, teamScore: 3, opponentScore: 1, result: 'W' },
      { date: '2025-01-21', opponent: 'Chelsea', isHome: true, teamScore: 4, opponentScore: 0, result: 'W' },
      { date: '2025-01-17', opponent: 'Tottenham', isHome: false, teamScore: 2, opponentScore: 2, result: 'D' },
      { date: '2025-01-13', opponent: 'Newcastle', isHome: true, teamScore: 3, opponentScore: 0, result: 'W' }
    ]
  },
  'Liverpool': {
    league: 'Premier League',
    form: ['L', 'W', 'W', 'W', 'D'],
    lastMatches: [
      { date: '2025-01-29', opponent: 'Manchester City', isHome: false, teamScore: 1, opponentScore: 2, result: 'L' },
      { date: '2025-01-25', opponent: 'Chelsea', isHome: true, teamScore: 2, opponentScore: 0, result: 'W' },
      { date: '2025-01-21', opponent: 'Arsenal', isHome: false, teamScore: 3, opponentScore: 1, result: 'W' },
      { date: '2025-01-17', opponent: 'Brighton', isHome: true, teamScore: 4, opponentScore: 1, result: 'W' },
      { date: '2025-01-13', opponent: 'West Ham', isHome: false, teamScore: 1, opponentScore: 1, result: 'D' }
    ]
  },
  'Arsenal': {
    league: 'Premier League',
    form: ['L', 'W', 'D', 'W', 'W'],
    lastMatches: [
      { date: '2025-01-26', opponent: 'Manchester City', isHome: true, teamScore: 1, opponentScore: 3, result: 'L' },
      { date: '2025-01-22', opponent: 'Liverpool', isHome: true, teamScore: 1, opponentScore: 3, result: 'L' },
      { date: '2025-01-18', opponent: 'Manchester United', isHome: false, teamScore: 2, opponentScore: 2, result: 'D' },
      { date: '2025-01-14', opponent: 'Tottenham', isHome: true, teamScore: 3, opponentScore: 1, result: 'W' },
      { date: '2025-01-10', opponent: 'Chelsea', isHome: false, teamScore: 2, opponentScore: 1, result: 'W' }
    ]
  },

  // La Liga
  'Real Madrid': {
    league: 'La Liga',
    form: ['W', 'W', 'D', 'W', 'W'],
    lastMatches: [
      { date: '2025-01-30', opponent: 'Barcelona', isHome: true, teamScore: 3, opponentScore: 1, result: 'W' },
      { date: '2025-01-26', opponent: 'Atletico Madrid', isHome: false, teamScore: 2, opponentScore: 0, result: 'W' },
      { date: '2025-01-22', opponent: 'Sevilla', isHome: true, teamScore: 1, opponentScore: 1, result: 'D' },
      { date: '2025-01-18', opponent: 'Valencia', isHome: false, teamScore: 4, opponentScore: 1, result: 'W' },
      { date: '2025-01-14', opponent: 'Real Betis', isHome: true, teamScore: 3, opponentScore: 0, result: 'W' }
    ]
  },
  'Barcelona': {
    league: 'La Liga',
    form: ['L', 'W', 'W', 'D', 'W'],
    lastMatches: [
      { date: '2025-01-30', opponent: 'Real Madrid', isHome: false, teamScore: 1, opponentScore: 3, result: 'L' },
      { date: '2025-01-26', opponent: 'Sevilla', isHome: true, teamScore: 2, opponentScore: 1, result: 'W' },
      { date: '2025-01-22', opponent: 'Villarreal', isHome: false, teamScore: 3, opponentScore: 0, result: 'W' },
      { date: '2025-01-18', opponent: 'Athletic Bilbao', isHome: true, teamScore: 2, opponentScore: 2, result: 'D' },
      { date: '2025-01-14', opponent: 'Espanyol', isHome: false, teamScore: 4, opponentScore: 1, result: 'W' }
    ]
  }
};

// Función principal para obtener estadísticas de equipo
export const getTeamLastMatches = async (teamName, limit = 5) => {
  try {
    console.log(`🔍 Buscando estadísticas para: ${teamName}`);
    
    // 1. Intentar obtener desde API-Sports
    let matches = await getLastMatchesFromApiSports(teamName, limit);
    
    // 2. Si no hay datos de API, usar datos de muestra específicos
    if (matches.length === 0) {
      matches = getTeamSampleMatches(teamName, limit);
    }
    
    console.log(`📊 ${teamName}: ${matches.length} partidos encontrados`);
    return matches;
    
  } catch (error) {
    console.error(`❌ Error obteniendo estadísticas para ${teamName}:`, error);
    return getTeamSampleMatches(teamName, limit);
  }
};

// Obtener partidos desde API-Sports
const getLastMatchesFromApiSports = async (teamName, limit) => {
  try {
    const apiKey = import.meta.env.VITE_API_SPORTS_KEY;
    if (!apiKey) {
      console.log('⚠️ No API key disponible para API-Sports');
      return [];
    }

    // 1. Buscar el equipo para obtener su ID
    const teamId = await findTeamIdInLeagues(teamName, apiKey);
    if (!teamId.id) {
      console.log(`⚠️ No se encontró ID para ${teamName}`);
      return [];
    }

    console.log(`🔍 ID encontrado para ${teamName}: ${teamId.id} (Liga: ${teamId.league})`);

    // 2. Obtener últimos partidos del equipo
    const response = await fetch(
      `${API_SPORTS_URL}/fixtures?team=${teamId.id}&last=${limit}&timezone=America/Mexico_City`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ Error consultando partidos: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const matches = data.response || [];

    console.log(`📊 API devolvió ${matches.length} partidos para ${teamName}`);

    return matches.map(match => formatApiSportsMatchData(match, teamName));

  } catch (error) {
    console.error('❌ Error en API-Sports:', error);
    return [];
  }
};

// Buscar ID de equipo en todas las ligas configuradas
const findTeamIdInLeagues = async (teamName, apiKey) => {
  for (const [leagueName, leagueData] of Object.entries(LEAGUE_MAPPING)) {
    try {
      console.log(`🔍 Buscando ${teamName} en ${leagueName}...`);
      
      const response = await fetch(
        `${API_SPORTS_URL}/teams?league=${leagueData.id}&season=${leagueData.season}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const teams = data.response || [];
        
        const team = teams.find(t => 
          t.team.name.toLowerCase().includes(teamName.toLowerCase()) ||
          teamName.toLowerCase().includes(t.team.name.toLowerCase()) ||
          // Coincidencias parciales más flexibles
          normalizeTeamName(t.team.name) === normalizeTeamName(teamName)
        );
        
        if (team) {
          console.log(`✅ Equipo encontrado: ${team.team.name} en ${leagueName}`);
          return { 
            id: team.team.id, 
            league: leagueName,
            realName: team.team.name 
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error buscando en ${leagueName}:`, error);
    }
  }
  
  return { id: null, league: null };
};

// Normalizar nombres de equipos para mejor coincidencia
const normalizeTeamName = (name) => {
  return name.toLowerCase()
    .replace(/fc|cf|club|united|city|real|athletic|sporting/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Formatear datos de partido de API-Sports
const formatApiSportsMatchData = (match, teamName) => {
  const isHome = match.teams.home.name.toLowerCase().includes(teamName.toLowerCase()) ||
                 teamName.toLowerCase().includes(match.teams.home.name.toLowerCase());
  
  const opponent = isHome ? match.teams.away.name : match.teams.home.name;
  const teamScore = isHome ? match.goals.home : match.goals.away;
  const opponentScore = isHome ? match.goals.away : match.goals.home;
  
  let result = 'D'; // Draw
  if (teamScore > opponentScore) result = 'W'; // Win
  if (teamScore < opponentScore) result = 'L'; // Loss

  return {
    date: new Date(match.fixture.date),
    opponent,
    isHome,
    teamScore: teamScore || 0,
    opponentScore: opponentScore || 0,
    result,
    competition: match.league.name,
    status: match.fixture.status.short,
    venue: match.fixture.venue?.name
  };
};

// Obtener datos de muestra para equipos
const getTeamSampleMatches = (teamName, limit) => {
  // Si tenemos datos específicos para el equipo, usarlos
  if (TEAM_SAMPLE_DATA[teamName]) {
    const teamData = TEAM_SAMPLE_DATA[teamName];
    return teamData.lastMatches
      .slice(0, limit)
      .map(match => ({
        ...match,
        date: new Date(match.date),
        competition: teamData.league
      }));
  }
  
  // Generar datos realistas basados en la liga del equipo
  const league = detectTeamLeague(teamName);
  return generateRealisticMatches(teamName, league, limit);
};

// Detectar liga basada en el nombre del equipo
const detectTeamLeague = (teamName) => {
  const mexicanTeams = ['américa', 'chivas', 'cruz azul', 'pumas', 'tigres', 'monterrey', 'santos', 'león', 'toluca', 'atlas', 'pachuca', 'puebla', 'necaxa', 'querétaro', 'tijuana', 'mazatlán', 'juárez', 'san luis'];
  const englishTeams = ['manchester', 'liverpool', 'arsenal', 'chelsea', 'tottenham', 'newcastle', 'brighton', 'west ham', 'aston villa', 'crystal palace', 'leicester', 'leeds', 'southampton', 'wolves', 'burnley', 'watford', 'norwich', 'brentford'];
  const spanishTeams = ['madrid', 'barcelona', 'atletico', 'sevilla', 'valencia', 'villarreal', 'betis', 'sociedad', 'athletic', 'celta', 'espanyol', 'getafe', 'osasuna', 'mallorca', 'cadiz', 'elche', 'levante', 'alaves'];
  
  const name = teamName.toLowerCase();
  
  if (mexicanTeams.some(team => name.includes(team))) return 'Liga MX';
  if (englishTeams.some(team => name.includes(team))) return 'Premier League';
  if (spanishTeams.some(team => name.includes(team))) return 'La Liga';
  
  // Por defecto
  return 'Liga Internacional';
};

// Generar partidos realistas
const generateRealisticMatches = (teamName, league, limit) => {
  const opponents = getLeagueOpponents(league);
  const results = ['W', 'L', 'D'];
  
  return Array.from({ length: limit }, (_, index) => {
    const result = results[Math.floor(Math.random() * results.length)];
    let teamScore, opponentScore;
    
    // Generar marcadores realistas basados en el resultado
    switch (result) {
      case 'W':
        teamScore = Math.floor(Math.random() * 3) + 1; // 1-3 goles
        opponentScore = Math.floor(Math.random() * teamScore); // 0 a teamScore-1
        break;
      case 'L':
        opponentScore = Math.floor(Math.random() * 3) + 1; // 1-3 goles
        teamScore = Math.floor(Math.random() * opponentScore); // 0 a opponentScore-1
        break;
      default: // Draw
        const score = Math.floor(Math.random() * 3); // 0-2 para empates
        teamScore = opponentScore = score;
    }

    const date = new Date();
    date.setDate(date.getDate() - (index + 1) * 7); // Cada semana hacia atrás

    return {
      date,
      opponent: opponents[Math.floor(Math.random() * opponents.length)],
      isHome: Math.random() > 0.5,
      teamScore,
      opponentScore,
      result,
      competition: league
    };
  });
};

// Obtener oponentes típicos por liga
const getLeagueOpponents = (league) => {
  const opponents = {
    'Liga MX': ['Rival FC', 'Club Local', 'Deportivo Unidos', 'FC Nacional', 'Atlético Regional'],
    'Premier League': ['City United', 'FC London', 'Athletic Club', 'Rangers FC', 'United FC'],
    'La Liga': ['FC Barcelona B', 'Real Club', 'Deportivo FC', 'Athletic Unidos', 'Club Valencia'],
    'Serie A': ['AC Local', 'Inter Unidos', 'Juventus B', 'AS Club', 'FC Milano'],
    'Bundesliga': ['FC Bayern B', 'Borussia Club', 'FC Hamburg', 'SC Unidos', 'FC Berlin'],
    'Ligue 1': ['PSG B', 'Olympique Club', 'FC Lyon B', 'AS Monaco B', 'FC Nantes'],
    'Champions League': ['European FC', 'Continental Club', 'International FC', 'Elite Club', 'Champion FC']
  };
  
  return opponents[league] || opponents['Liga MX'];
};

// Calcular estadísticas del equipo
export const calculateTeamStats = (matches) => {
  if (!matches || matches.length === 0) {
    return {
      form: [],
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      winPercentage: 0,
      averageGoalsFor: 0,
      averageGoalsAgainst: 0,
      cleanSheets: 0,
      failedToScore: 0
    };
  }

  const wins = matches.filter(m => m.result === 'W').length;
  const draws = matches.filter(m => m.result === 'D').length;
  const losses = matches.filter(m => m.result === 'L').length;
  const goalsFor = matches.reduce((total, m) => total + (m.teamScore || 0), 0);
  const goalsAgainst = matches.reduce((total, m) => total + (m.opponentScore || 0), 0);
  const cleanSheets = matches.filter(m => (m.opponentScore || 0) === 0).length;
  const failedToScore = matches.filter(m => (m.teamScore || 0) === 0).length;

  return {
    form: matches.map(m => m.result).slice(0, 5), // Últimos 5 resultados
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    winPercentage: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
    averageGoalsFor: matches.length > 0 ? (goalsFor / matches.length).toFixed(1) : '0.0',
    averageGoalsAgainst: matches.length > 0 ? (goalsAgainst / matches.length).toFixed(1) : '0.0',
    cleanSheets,
    failedToScore,
    totalMatches: matches.length
  };
};

// Obtener información específica de enfrentamiento directo
export const getHeadToHeadStats = async (team1, team2) => {
  try {
    console.log(`🔍 Buscando enfrentamientos directos: ${team1} vs ${team2}`);
    
    // Por ahora retornamos datos de muestra
    // En producción aquí iría la lógica para buscar H2H en la API
    
    return {
      totalMatches: 5,
      team1Wins: 2,
      team2Wins: 2,
      draws: 1,
      lastMeetings: [
        { date: '2024-10-15', homeTeam: team1, awayTeam: team2, homeScore: 2, awayScore: 1 },
        { date: '2024-05-20', homeTeam: team2, awayTeam: team1, homeScore: 0, awayScore: 1 },
        { date: '2024-01-10', homeTeam: team1, awayTeam: team2, homeScore: 1, awayScore: 1 }
      ]
    };
  } catch (error) {
    console.error('Error getting head to head stats:', error);
    return null;
  }
};