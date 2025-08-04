// src/services/weeklyMatchesService.js - API-Football CORREGIDO

// 🎯 API-Football DIRECTO - SÍ tiene Liga MX confirmado
const API_BASE_URL = 'https://v3.football.api-sports.io';

// 🏆 CONFIGURACIÓN DE LIGAS (IDs confirmados de API-Football)
const TARGET_LEAGUES = {
  // Liga MX México (CONFIRMADO - ID correcto)
  262: { name: 'Liga MX', country: 'Mexico', season: 2025 },
  
  // Premier League
  39: { name: 'Premier League', country: 'England', season: 2025 },
  
  // La Liga España
  140: { name: 'La Liga', country: 'Spain', season: 2025 },

  // Serie A Italia
  135: { name: 'Serie A', country: 'Italy', season: 2025 },

  // Bundesliga Alemania
  78: { name: 'Bundesliga', country: 'Germany', season: 2025 },

  // Ligue 1 Francia
  61: { name: 'Ligue 1', country: 'France', season: 2025 },

  // Champions League
  2: { name: 'Champions League', country: 'Europe', season: 2025 }
};

// Función principal para obtener partidos de la semana
export const getWeeklyMatches = async (weekOffset = 0) => {
  try {
    console.log(`🔍 Obteniendo partidos para semana ${weekOffset === 0 ? 'actual' : `+${weekOffset}`}`);
    console.log('🎯 Usando API-Football DIRECTO (confirma Liga MX)');

    // ✅ CORREGIDO: Usar VITE_API_SPORTS_KEY (consistente con el proyecto)
    const apiKey = import.meta.env.VITE_API_SPORTS_KEY;
    if (!apiKey) {
      console.error('❌ No se encontró VITE_API_SPORTS_KEY - Regístrate en https://dashboard.api-football.com');
      console.error('🔧 Asegúrate de tener la variable en tu archivo .env:');
      console.error('   VITE_API_SPORTS_KEY=tu_api_key_aqui');
      return getSampleWeeklyMatches(weekOffset);
    }

    // Calcular fechas para la semana
    const { startDate, endDate } = getWeekDates(weekOffset);
    console.log(`📅 Buscando partidos desde ${startDate} hasta ${endDate}`);

    const allMatches = [];
    const leagueIds = Object.keys(TARGET_LEAGUES);

    // Obtener partidos para cada liga
    for (const leagueId of leagueIds) {
      const leagueMatches = await getMatchesForLeague(leagueId, startDate, endDate, apiKey);
      allMatches.push(...leagueMatches);
    }

    // Ordenar por fecha y filtrar duplicados
    const sortedMatches = allMatches
      .filter((match, index, self) => 
        index === self.findIndex(m => m.apiId === match.apiId)
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`✅ Encontrados ${sortedMatches.length} partidos únicos`);
    
    if (sortedMatches.length === 0) {
      console.log('⚠️ No se encontraron partidos en API, usando datos de muestra');
      return getSampleWeeklyMatches(weekOffset);
    }
    
    return sortedMatches;

  } catch (error) {
    console.error('❌ Error obteniendo partidos semanales:', error);
    return getSampleWeeklyMatches(weekOffset);
  }
};

// Obtener partidos para una liga específica
const getMatchesForLeague = async (leagueId, startDate, endDate, apiKey) => {
  try {
    const league = TARGET_LEAGUES[leagueId];
    console.log(`🏆 Consultando ${league.name}...`);

    const response = await fetch(
      `${API_BASE_URL}/fixtures?league=${leagueId}&season=${league.season}&from=${startDate}&to=${endDate}&timezone=America/Mexico_City`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ Error consultando ${league.name}: ${response.status} ${response.statusText}`);
      
      if (response.status === 401 || response.status === 403) {
        console.error('🔑 API Key inválida o sin permisos - Verifica tu clave en https://dashboard.api-football.com');
      } else if (response.status === 429) {
        console.error('🚫 Límite de requests excedido - Espera o actualiza tu plan');
      } else if (response.status >= 500) {
        console.error('⚡ Error del servidor API-Football - Intenta más tarde');
      }
      
      return [];
    }

    const data = await response.json();
    
    // ✅ CORREGIDO: Logging detallado de errores
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error(`❌ Errores específicos de API para ${league.name}:`);
      console.error(JSON.stringify(data.errors, null, 2));
      
      // Mensajes específicos para errores comunes
      if (data.errors.requests) {
        console.error('🚫 Error de límite de requests:', data.errors.requests);
      }
      if (data.errors.league) {
        console.error('🏆 Error de liga:', data.errors.league);
      }
      if (data.errors.season) {
        console.error('📅 Error de temporada:', data.errors.season);
      }
      
      return [];
    }
    
    const matches = data.response || [];
    console.log(`📊 ${league.name}: ${matches.length} partidos encontrados`);

    // Log adicional para debugging
    if (matches.length === 0) {
      console.log(`💡 Tip para ${league.name}: Verifica si la temporada ${league.season} es correcta`);
      console.log(`💡 O si hay partidos en el rango ${startDate} - ${endDate}`);
    }

    return matches.map(match => ({
      id: `api_${match.fixture.id}`,
      apiId: match.fixture.id.toString(),
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      league: league.name,
      country: league.country,
      date: new Date(match.fixture.date),
      status: match.fixture.status.short,
      venue: match.fixture.venue?.name || 'Sin especificar',
      round: match.league.round || 'Jornada',
      homeScore: match.goals.home,
      awayScore: match.goals.away,
      source: 'api-football-direct',
      leagueId: parseInt(leagueId),
      season: league.season,
      // Información adicional
      homeTeamLogo: match.teams.home.logo,
      awayTeamLogo: match.teams.away.logo,
      leagueLogo: match.league.logo,
      referee: match.fixture.referee
    }));

  } catch (error) {
    console.error(`❌ Error consultando liga ${leagueId} (${TARGET_LEAGUES[leagueId]?.name}):`, error);
    
    // Logging más detallado del error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Error de conexión - Verifica tu internet');
    } else if (error.name === 'SyntaxError') {
      console.error('📄 Error parsing JSON - Respuesta inválida del servidor');
    }
    
    return [];
  }
};

// Calcular fechas de la semana (Lunes a Domingo)
const getWeekDates = (weekOffset = 0) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  
  // Calcular el lunes de la semana actual
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Aplicar offset de semanas
  monday.setDate(monday.getDate() + (weekOffset * 7));
  
  // Calcular domingo
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
    weekStart: monday,
    weekEnd: sunday
  };
};

// Función para obtener próximas semanas disponibles
export const getAvailableWeeks = () => {
  const weeks = [];
  
  for (let i = 0; i < 4; i++) { // Próximas 4 semanas
    const { weekStart, weekEnd } = getWeekDates(i);
    
    weeks.push({
      offset: i,
      label: i === 0 ? 'Esta semana' : 
             i === 1 ? 'Próxima semana' : 
             `Semana del ${weekStart.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}`,
      startDate: weekStart,
      endDate: weekEnd,
      dateRange: `${weekStart.toLocaleDateString('es-MX', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })} - ${weekEnd.toLocaleDateString('es-MX', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })}`
    });
  }
  
  return weeks;
};

// Agrupar partidos por liga
export const groupMatchesByLeague = (matches) => {
  const grouped = {};
  
  matches.forEach(match => {
    if (!grouped[match.league]) {
      grouped[match.league] = [];
    }
    grouped[match.league].push(match);
  });
  
  // Ordenar ligas por prioridad (Liga MX primero)
  const leaguePriority = [
    'Liga MX',           // 🇲🇽 Primero
    'Champions League',
    'Premier League', 
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Ligue 1'
  ];
  
  const sortedGrouped = {};
  leaguePriority.forEach(league => {
    if (grouped[league]) {
      sortedGrouped[league] = grouped[league].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  });
  
  // Agregar ligas no prioritarias al final
  Object.keys(grouped).forEach(league => {
    if (!leaguePriority.includes(league)) {
      sortedGrouped[league] = grouped[league].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  });
  
  return sortedGrouped;
};

// Datos de muestra cuando la API no está disponible
const getSampleWeeklyMatches = (weekOffset) => {
  const { weekStart } = getWeekDates(weekOffset);
  
  const sampleMatches = [
    // Liga MX (prioritaria)
    {
      id: 'sample_mx_1',
      homeTeam: 'América',
      awayTeam: 'Chivas',
      league: 'Liga MX',
      country: 'Mexico',
      date: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), // Viernes 9PM
      status: 'NS',
      venue: 'Estadio Azteca',
      round: 'Jornada 5',
      source: 'sample'
    },
    {
      id: 'sample_mx_2',
      homeTeam: 'Cruz Azul',
      awayTeam: 'Pumas',
      league: 'Liga MX',
      country: 'Mexico',
      date: new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), // Sábado 7PM
      status: 'NS',
      venue: 'Estadio Ciudad de los Deportes',
      round: 'Jornada 5',
      source: 'sample'
    },
    {
      id: 'sample_mx_3',
      homeTeam: 'Tigres',
      awayTeam: 'Monterrey',
      league: 'Liga MX',
      country: 'Mexico',
      date: new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), // Sábado 9PM
      status: 'NS',
      venue: 'Estadio Universitario',
      round: 'Jornada 5',
      source: 'sample'
    },
    
    // Champions League
    {
      id: 'sample_cl_1',
      homeTeam: 'Real Madrid',
      awayTeam: 'Manchester City',
      league: 'Champions League',
      country: 'Europe',
      date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), // Miércoles 9PM
      status: 'NS',
      venue: 'Santiago Bernabéu',
      round: 'Octavos de Final',
      source: 'sample'
    },
    
    // Premier League
    {
      id: 'sample_pl_1',
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      league: 'Premier League',
      country: 'England',
      date: new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // Sábado 5PM
      status: 'NS',
      venue: 'Emirates Stadium',
      round: 'Jornada 24',
      source: 'sample'
    }
  ];
  
  return sampleMatches;
};

// ✅ CORREGIDO: Verificar disponibilidad de la API con mejor logging
export const checkApiAvailability = async () => {
  try {
    const apiKey = import.meta.env.VITE_API_SPORTS_KEY;
    if (!apiKey) {
      return { 
        available: false, 
        reason: 'No API key configured',
        message: 'Agrega VITE_API_SPORTS_KEY a tu archivo .env'
      };
    }

    console.log('🔍 Verificando estado de API-Football...');
    const response = await fetch(`${API_BASE_URL}/timezone`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API-Football funcionando correctamente');
      return { 
        available: true, 
        requestsRemaining: data.requests?.current || 'Unknown',
        requestsTotal: data.requests?.limit_day || 'Unknown',
        message: 'API-Football funcionando'
      };
    }

    console.error(`❌ API-Football devolvió status ${response.status}`);
    return { available: false, reason: `HTTP ${response.status}` };
  } catch (error) {
    console.error('❌ Error verificando API-Football:', error);
    return { available: false, reason: error.message };
  }
};

// Obtener detalles de un partido específico
export const getMatchDetails = async (matchApiId) => {
  try {
    const apiKey = import.meta.env.VITE_API_SPORTS_KEY; // ✅ CORREGIDO
    if (!apiKey) return null;

    const response = await fetch(
      `${API_BASE_URL}/fixtures?id=${matchApiId}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.response[0] || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting match details:', error);
    return null;
  }
};