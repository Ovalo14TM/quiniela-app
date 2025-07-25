// src/utils/pwaUtils.js

// Registrar Service Worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nueva versión del Service Worker disponible');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión lista, preguntar si actualizar
            showUpdatePrompt(registration);
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      return null;
    }
  } else {
    console.log('⚠️ Service Worker no soportado');
    return null;
  }
};

// Mostrar prompt para actualizar
const showUpdatePrompt = (registration) => {
  const updateApp = confirm(
    '🚀 Nueva versión disponible!\n¿Quieres actualizar la app?'
  );
  
  if (updateApp) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

// Verificar si la app está instalada
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Mostrar prompt de instalación
export const showInstallPrompt = () => {
  let deferredPrompt = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botón de instalación personalizado
    showCustomInstallButton(deferredPrompt);
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('🎉 App instalada exitosamente');
    deferredPrompt = null;
    hideCustomInstallButton();
    
    // Opcional: mostrar onboarding
    showPostInstallMessage();
  });
};

// Mostrar botón de instalación personalizado
const showCustomInstallButton = (deferredPrompt) => {
  // Crear botón si no existe
  let installButton = document.getElementById('install-button');
  
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.innerHTML = '📱 Instalar App';
    installButton.className = 'fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all transform hover:scale-105';
    
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('Resultado instalación:', outcome);
        
        if (outcome === 'accepted') {
          console.log('✅ Usuario aceptó instalar');
        } else {
          console.log('❌ Usuario rechazó instalar');
        }
        
        deferredPrompt = null;
        hideCustomInstallButton();
      }
    });
    
    document.body.appendChild(installButton);
  }
  
  installButton.style.display = 'block';
};

// Ocultar botón de instalación
const hideCustomInstallButton = () => {
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
};

// Mensaje post-instalación
const showPostInstallMessage = () => {
  // Crear toast de confirmación
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
  toast.innerHTML = `
    <div class="flex items-center">
      <span class="text-xl mr-2">🎉</span>
      <div>
        <div class="font-semibold">¡App instalada!</div>
        <div class="text-sm">Ya puedes usarla desde tu pantalla de inicio</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Remover después de 5 segundos
  setTimeout(() => {
    toast.remove();
  }, 5000);
};

// Solicitar permisos para notificaciones
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('⚠️ Notificaciones no soportadas');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('✅ Permisos de notificación ya otorgados');
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.log('❌ Permisos de notificación denegados');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Permisos de notificación otorgados');
      return true;
    } else {
      console.log('❌ Permisos de notificación denegados por usuario');
      return false;
    }
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

// Mostrar notificación local
export const showLocalNotification = (title, options = {}) => {
  if (Notification.permission !== 'granted') {
    console.log('⚠️ Sin permisos para notificaciones');
    return;
  }
  
  const defaultOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'quiniela-local',
    requireInteraction: false,
    ...options
  };
  
  const notification = new Notification(title, defaultOptions);
  
  notification.onclick = () => {
    window.focus();
    notification.close();
    
    if (options.url) {
      window.location.href = options.url;
    }
  };
  
  // Auto-cerrar después de 10 segundos
  setTimeout(() => {
    notification.close();
  }, 10000);
  
  return notification;
};

// Programar notificación para deadline
export const scheduleDeadlineNotification = (deadline, quinielaTitle) => {
  if (!('serviceWorker' in navigator)) return;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const oneHourBefore = new Date(deadlineDate.getTime() - (60 * 60 * 1000));
  
  if (oneHourBefore > now) {
    const delay = oneHourBefore.getTime() - now.getTime();
    
    setTimeout(() => {
      showLocalNotification(
        '⏰ ¡Último llamado!',
        {
          body: `La quiniela "${quinielaTitle}" cierra en 1 hora`,
          tag: 'deadline-reminder',
          requireInteraction: true,
          actions: [
            { action: 'open', title: 'Hacer predicciones' },
            { action: 'close', title: 'Recordar después' }
          ]
        }
      );
    }, delay);
    
    console.log(`⏰ Notificación programada para: ${oneHourBefore.toLocaleString()}`);
  }
};

// Detectar si está en modo offline
export const detectOnlineStatus = () => {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log(`🌐 Estado de conexión: ${status}`);
    
    // Mostrar indicador visual
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.textContent = navigator.onLine ? '🟢' : '🔴';
      indicator.title = navigator.onLine ? 'Conectado' : 'Sin conexión';
    }
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('connectionchange', {
      detail: { online: navigator.onLine }
    }));
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Estado inicial
  updateOnlineStatus();
};

// Obtener información de la conexión
export const getConnectionInfo = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType, // '4g', '3g', etc.
      downlink: connection.downlink, // Velocidad en Mbps
      rtt: connection.rtt, // Latencia en ms
      saveData: connection.saveData // Modo ahorro de datos
    };
  }
  
  return null;
};

// Inicializar PWA completa
export const initializePWA = async () => {
  console.log('🚀 Inicializando PWA...');
  
  // Registrar Service Worker
  await registerServiceWorker();
  
  // Configurar prompt de instalación
  showInstallPrompt();
  
  // Solicitar permisos de notificación
  await requestNotificationPermission();
  
  // Detectar estado de conexión
  detectOnlineStatus();
  
  // Verificar si ya está instalada
  if (isAppInstalled()) {
    console.log('📱 App ejecutándose como PWA instalada');
  } else {
    console.log('🌐 App ejecutándose en navegador');
  }
  
  console.log('✅ PWA inicializada correctamente');
};