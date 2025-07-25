// Service Worker para Quiniela Primos PWA
const CACHE_NAME = 'quiniela-primos-v1.0';
const STATIC_CACHE_NAME = 'quiniela-static-v1.0';
const DYNAMIC_CACHE_NAME = 'quiniela-dynamic-v1.0';

// Archivos esenciales para caché estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Agregar aquí assets críticos cuando estén disponibles
];

// URLs que siempre necesitan conexión
const NETWORK_ONLY = [
  '/api/',
  'https://firebase.googleapis.com',
  'https://firestore.googleapis.com',
  'https://api.football-data.org',
  'https://v3.football.api-sports.io'
];

// URLs para caché dinámico
const CACHE_DYNAMIC = [
  '/src/components/',
  '/src/services/',
  '/src/hooks/',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Error cacheando assets estáticos:', error);
      })
  );
  
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cachés viejos
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Eliminando caché viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Reclamar control de todas las páginas
  self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones no HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Network Only para APIs críticas
  if (NETWORK_ONLY.some(pattern => request.url.includes(pattern))) {
    event.respondWith(
      fetch(request).catch(() => {
        // Si falla la red, mostrar página offline para APIs
        return new Response(
          JSON.stringify({ 
            error: 'Sin conexión', 
            message: 'Esta función requiere conexión a internet' 
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }
  
  // Cache First para assets estáticos
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Sirviendo desde caché:', request.url);
          return cachedResponse;
        }
        
        // Si no está en caché, obtener de red y cachear
        return fetch(request).then((networkResponse) => {
          // Solo cachear respuestas exitosas
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return networkResponse;
        }).catch(() => {
          // Fallback para páginas
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Fallback para imágenes
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Sin imagen</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
    );
    return;
  }
  
  // Network First para datos dinámicos
  event.respondWith(
    fetch(request).then((networkResponse) => {
      const responseClone = networkResponse.clone();
      
      // Cachear respuestas exitosas
      if (networkResponse.status === 200) {
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      
      return networkResponse;
    }).catch(() => {
      // Fallback a caché si falla la red
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Fallback desde caché:', request.url);
          return cachedResponse;
        }
        
        // Última opción: respuesta offline genérica
        return new Response(
          JSON.stringify({ 
            error: 'Sin conexión',
            message: 'No hay conexión a internet y no hay datos en caché',
            offline: true
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      });
    })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.title = event.data.text() || 'Quiniela Primos';
    }
  }
  
  const options = {
    title: data.title || 'Quiniela Primos',
    body: data.body || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: data.image,
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Ver',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/action-close.png'
      }
    ],
    tag: data.tag || 'quiniela-notification',
    requireInteraction: data.urgent || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);
  
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data || '/';
  
  if (action === 'close') {
    return;
  }
  
  // Abrir o enfocar la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            if (url !== '/') {
              client.navigate(url);
            }
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        return clients.openWindow(url);
      })
  );
});

// Manejar mensajes desde la app principal
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-predictions') {
    event.waitUntil(syncPredictions());
  }
  
  if (event.tag === 'background-sync-results') {
    event.waitUntil(syncResults());
  }
});

// Funciones auxiliares para sincronización
async function syncPredictions() {
  try {
    // Aquí puedes implementar lógica para sincronizar predicciones
    console.log('[SW] Sincronizando predicciones...');
    
    // Ejemplo: obtener predicciones pendientes del IndexedDB
    // y enviarlas al servidor cuando haya conexión
    
  } catch (error) {
    console.error('[SW] Error sincronizando predicciones:', error);
  }
}

async function syncResults() {
  try {
    console.log('[SW] Sincronizando resultados...');
    
    // Ejemplo: actualizar resultados y puntuaciones
    
  } catch (error) {
    console.error('[SW] Error sincronizando resultados:', error);
  }
}

// Limpieza periódica de caché
setInterval(() => {
  caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
    cache.keys().then((requests) => {
      if (requests.length > 50) { // Limitar caché dinámico
        cache.delete(requests[0]);
      }
    });
  });
}, 24 * 60 * 60 * 1000); // Cada 24 horas