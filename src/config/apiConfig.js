// src/config/apiConfig.js - Configuración centralizada de todas las APIs

// 🌐 URLs base de las APIs
export const API_ENDPOINTS = {
  API_SPORTS: 'https://v3.football.api-sports.io',
  FOOTBALL_DATA: 'https://api.football-data.org/v4'
};

// 🏆 CONFIGURACIÓN COMPLETA DE LIGAS
export const LEAGUES_CONFIG = {
  // Liga MX (México)
  LIGA_MX: {
    id: 2621,
    name: 'Liga MX',
    country: 'Mexico',
    season: 2024,
    priority: 7, // Orden de preferencia
    color: '#22c55e',
    icon: '🇲🇽',
    timezone: 'America/Mexico_City'
  },

  // Leagues Cup (México/USA)
  LEAGUES_CUP: {
    id: 848, // Verificar este ID
    name: 'Leagues Cup',
    country: 'North America',
    season: 2024,
    priority: 6,
    color: '#3b82f6',
    icon: '🏆',
    timezone: 'America/Mexico_City'
  },

  // Premier League (Inglaterra)
  PREMIER_LEAGUE: {
    id: 39,
    name: 'Premier League',
    country: 'England',
    season: 2024,
    priority: 1,
    color: '#7c3aed',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    timezone: 'Europe/London'
  },

  // La Liga (España)
  LA_LIGA: {
    id: 140,
    name: 'La Liga',
    country: 'Spain',
    season: 2024,
    priority: 2,
    color: '#ef4444',
    icon: '🇪🇸',
    timezone: 'Europe/Madrid'
  },

  // Ligue 1 (Francia)
  LIGUE_1: {
    id: 61,
    name: 'Ligue 1',
    country: 'France',
    season: 2024,
    priority: 5,
    color: '#3b82f6',
    icon: '🇫🇷',
    timezone: 'Europe/Paris'
  },

  // Serie A (Italia)
  SERIE_A: {
    id: 135,
    name: 'Serie A',
    country: 'Italy',
    season: 2024,
    priority: 4,
    color: '#10b981',
    icon: '🇮🇹',
    timezone: 'Europe/Rome'
  },

  // Bundesliga (Alemania)
  BUNDESLIGA: {
    id: 78,
    name: 'Bundesliga',
    country: 'Germany',
    season: 2024,
    priority: 3,
    color: '#f59e0b',
    icon: '🇩🇪',
    timezone: 'Europe/Berlin'
  },

  // Champions League
  CHAMPIONS_LEAGUE: {
    id: 2,
    name: 'Champions League',
    country: 'Europe',
    season: 2024,
    priority: 0, // Máxima prioridad
    color: '#8b5cf6',
    icon: '🏆',
    timezone: 'Europe/Zurich'
  }
};

// 📊 CONFIGURACIÓN DE ESTADÍSTICAS
export const STATS_CONFIG = {
  // Cantidad de partidos para estadísticas
  DEFAULT_MATCHES_LIMIT: 5,
  MAX_MATCHES_LIMIT: 10,
  
  // Colores para resultados
  RESULT_COLORS: {
    W: '#10b981', // Verde - Victoria
    L: '#ef4444', // Rojo - Derrota  
    D: '#f59e0b'  // Amarillo - Empate
  },
  
  // Íconos para resultados
  RESULT_ICONS: {
    W: '✅',
    L: '❌', 
    D: '⚖️'
  },
  
  // Configuración de caché
  CACHE_DURATION: 60 * 60 * 1000, // 1 hora en milisegundos
  ENABLE_CACHE: true
};

// 🎯 EQUIPOS ESPECÍFICOS CON DATOS DE MUESTRA
export const TEAM_ALIASES = {
  // Liga MX - Alias y nombres alternativos
  'América': ['Club América', 'America', 'Águilas'],
  'Chivas': ['Guadalajara', 'CD Guadalajara', 'Club Deportivo Guadalajara'],
  'Cruz Azul': ['CD Cruz Azul', 'La Máquina'],
  'Pumas': ['Pumas UNAM', 'Universidad Nacional'],
  'Tigres': ['Tigres UANL', 'Universidad Autónoma de Nuevo León'],
  'Monterrey': ['CF Monterrey', 'Rayados'],
  'Santos': ['Santos Laguna', 'Guerreros'],
  'León': ['Club León', 'Fiera'],
  'Toluca': ['Deportivo Toluca', 'Diablos Rojos'],
  'Atlas': ['Club Atlas', 'Rojinegros'],
  'Pachuca': ['CF Pachuca', 'Tuzos'],
  'Puebla': ['Club Puebla', 'Camoteros'],
  'Necaxa': ['Club Necaxa', 'Rayos'],
  'Querétaro': ['Querétaro FC', 'Gallos Blancos'],
  'Tijuana': ['Club Tijuana', 'Xolos'],
  'Mazatlán': ['Mazatlán FC', 'Cañoneros'],
  'Juárez': ['FC Juárez', 'Bravos'],
  'San Luis': ['Atlético San Luis', 'Potosinos'],

  // Premier League
  'Manchester City': ['Man City', 'City', 'Citizens'],
  'Manchester United': ['Man United', 'Man Utd', 'United', 'Red Devils'],
  'Liverpool': ['Liverpool FC', 'Reds'],
  'Arsenal': ['Arsenal FC', 'Gunners'],
  'Chelsea': ['Chelsea FC', 'Blues'],
  'Tottenham': ['Tottenham Hotspur', 'Spurs'],
  'Newcastle': ['Newcastle United', 'Magpies'],
  'Brighton': ['Brighton & Hove Albion', 'Seagulls'],
  'West Ham': ['West Ham United', 'Hammers'],
  'Aston Villa': ['Villa'],

  // La Liga
  'Real Madrid': ['Madrid', 'Los Blancos'],
  'Barcelona': ['Barça', 'FC Barcelona', 'Blaugrana'],
  'Atletico Madrid': ['Atlético', 'Atleti', 'Colchoneros'],
  'Sevilla': ['Sevilla FC', 'Sevillistas'],
  'Valencia': ['Valencia CF', 'Los Che'],
  'Villarreal': ['Villarreal CF', 'Yellow Submarine'],
  'Real Betis': ['Betis', 'Béticos'],
  'Real Sociedad': ['La Real'],
  'Athletic Bilbao': ['Athletic', 'Lions'],

  // Serie A
  'Juventus': ['Juve', 'Bianconeri'],
  'AC Milan': ['Milan', 'Rossoneri'],
  'Inter Milan': ['Inter', 'Nerazzurri'],
  'AS Roma': ['Roma', 'Giallorossi'],
  'Napoli': ['SSC Napoli', 'Partenopei'],
  'Lazio': ['SS Lazio', 'Biancocelesti'],
  'Atalanta': ['Atalanta BC'],
  'Fiorentina': ['ACF Fiorentina', 'Viola'],

  // Bundesliga
  'Bayern Munich': ['Bayern', 'FC Bayern', 'Bavarians'],
  'Borussia Dortmund': ['BVB', 'Dortmund', 'Die Borussen'],
  'RB Leipzig': ['Leipzig', 'Red Bulls'],
  'Bayer Leverkusen': ['Leverkusen', 'Die Werkself'],
  'Eintracht Frankfurt': ['Frankfurt', 'Eagles'],
  'VfL Wolfsburg': ['Wolfsburg', 'Wolves'],
  'Borussia Mönchengladbach': ['Gladbach', 'Die Fohlen'],

  // Ligue 1
  'PSG': ['Paris Saint-Germain', 'Paris SG', 'Parisians'],
  'Olympique Marseille': ['Marseille', 'OM', 'Les Phocéens'],
  'AS Monaco': ['Monaco', 'Les Monégasques'],
  'Olympique Lyon': ['Lyon', 'OL', 'Les Gones'],
  'Lille': ['LOSC Lille', 'Les Dogues'],
  'Rennes': ['Stade Rennais', 'Les Rouge et Noir']
};

// 🚀 CONFIGURACIÓN DE RENDIMIENTO
export const PERFORMANCE_CONFIG = {
  // Timeouts para requests
  API_TIMEOUT: 10000, // 10 segundos
  BATCH_REQUEST_DELAY: 1000, // 1 segundo entre requests
  
  // Límites de requests
  MAX_CONCURRENT_REQUESTS: 3,
  RATE_LIMIT_PER_MINUTE: 50,
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 segundos
  
  // Configuración de datos de muestra
  FALLBACK_TO_SAMPLE_DATA: true,
  SAMPLE_DATA_PROBABILITY: 0.1 // 10% probabilidad de usar datos de muestra en desarrollo
};

// 🎨 CONFIGURACIÓN DE UI
export const UI_CONFIG = {
  // Colores del tema
  COLORS: {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    dark: '#1f2937'
  },
  
  // Configuración de animaciones
  ANIMATIONS: {
    LOADING_SPINNER_SPEED: '1s',
    FADE_DURATION: '0.3s',
    SLIDE_DURATION: '0.5s'
  },
  
  // Configuración responsive
  BREAKPOINTS: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px'
  },
  
  // Configuración de componentes
  COMPONENTS: {
    MATCHES_PER_PAGE: 20,
    STATS_EXPANSION_DELAY: 200,
    AUTO_SAVE_DELAY: 2000
  }
};

// 🔧 FUNCIONES UTILITARIAS
export const getLeagueById = (id) => {
  return Object.values(LEAGUES_CONFIG).find(league => league.id === id);
};

export const getLeagueByName = (name) => {
  return Object.values(LEAGUES_CONFIG).find(league => 
    league.name.toLowerCase() === name.toLowerCase()
  );
};

export const getAllLeagueIds = () => {
  return Object.values(LEAGUES_CONFIG).map(league => league.id);
};

export const getLeaguesSortedByPriority = () => {
  return Object.values(LEAGUES_CONFIG).sort((a, b) => a.priority - b.priority);
};

export const findTeamAlias = (teamName) => {
  const normalizedName = teamName.toLowerCase();
  
  for (const [mainName, aliases] of Object.entries(TEAM_ALIASES)) {
    if (mainName.toLowerCase() === normalizedName ||
        aliases.some(alias => alias.toLowerCase() === normalizedName)) {
      return mainName;
    }
  }
  
  return teamName; // Retorna el nombre original si no encuentra alias
};

export const getApiKey = () => {
  const apiKey = import.meta.env.VITE_API_SPORTS_KEY;
  if (!apiKey) {
    console.warn('⚠️ API key no configurada. Usando datos de muestra.');
  }
  return apiKey;
};

export const isApiAvailable = () => {
  return !!getApiKey();
};

// 📅 FUNCIONES DE FECHA
export const getWeekDates = (weekOffset = 0) => {
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

export const formatMatchDate = (date, locale = 'es-MX') => {
  if (!date) return 'Fecha no disponible';
  
  try {
    const matchDate = date.toDate ? date.toDate() : new Date(date);
    return matchDate.toLocaleString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

// 💾 FUNCIONES DE CACHÉ
export const getCacheKey = (prefix, ...args) => {
  return `quiniela_${prefix}_${args.join('_')}`;
};

export const setCache = (key, data) => {
  if (!STATS_CONFIG.ENABLE_CACHE) return;
  
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + STATS_CONFIG.CACHE_DURATION
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error saving to cache:', error);
  }
};

export const getCache = (key) => {
  if (!STATS_CONFIG.ENABLE_CACHE) return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    
    // Verificar si no ha expirado
    if (Date.now() > cacheData.expires) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

export const clearCache = (prefix = 'quiniela_') => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cache limpiado: ${keys.length} elementos eliminados`);
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

// 🔍 FUNCIÓN DE DEBUG
export const debugConfig = () => {
  console.group('🔧 Configuración del Sistema');
  console.log('📊 Ligas configuradas:', Object.keys(LEAGUES_CONFIG).length);
  console.log('🔑 API Key disponible:', isApiAvailable() ? '✅' : '❌');
  console.log('💾 Caché habilitado:', STATS_CONFIG.ENABLE_CACHE ? '✅' : '❌');
  console.log('🎯 Equipos con alias:', Object.keys(TEAM_ALIASES).length);
  console.groupEnd();
  
  return {
    leagues: Object.keys(LEAGUES_CONFIG).length,
    apiAvailable: isApiAvailable(),
    cacheEnabled: STATS_CONFIG.ENABLE_CACHE,
    teamsWithAliases: Object.keys(TEAM_ALIASES).length
  };
};

// Exportar todo como default también
export default {
  API_ENDPOINTS,
  LEAGUES_CONFIG,
  STATS_CONFIG,
  TEAM_ALIASES,
  PERFORMANCE_CONFIG,
  UI_CONFIG,
  getLeagueById,
  getLeagueByName,
  getAllLeagueIds,
  getLeaguesSortedByPriority,
  findTeamAlias,
  getApiKey,
  isApiAvailable,
  getWeekDates,
  formatMatchDate,
  getCacheKey,
  setCache,
  getCache,
  clearCache,
  debugConfig
};