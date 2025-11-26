import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UpdateBanner } from '@/components/UpdateBanner';

interface UpdateContextType {
  showUpdateBanner: boolean;
  triggerUpdate: () => void;
  dismissUpdate: () => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate debe usarse dentro de UpdateProvider');
  }
  return context;
};

interface UpdateProviderProps {
  children: React.ReactNode;
}

export const UpdateProvider: React.FC<UpdateProviderProps> = ({ children }) => {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Función para limpiar todos los cachés del Service Worker
  const clearAllCaches = async () => {
    try {
      // Limpiar todos los cachés del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Todos los cachés limpiados:', cacheNames);
      }
    } catch (error) {
      console.error('Error al limpiar cachés:', error);
    }
  };

  // Función para actualizar la aplicación
  const triggerUpdate = useCallback(async () => {
    try {
      console.log('🔄 Iniciando actualización...');

      // Limpiar todos los cachés
      await clearAllCaches();

      // Si hay un Service Worker esperando, activarlo
      if (serviceWorkerRegistration?.waiting) {
        console.log('📢 Enviando mensaje SKIP_WAITING al Service Worker');
        serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Esperar un momento para que el SW se active
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Actualizar la versión en localStorage
      const currentVersion = import.meta.env.VITE_APP_VERSION || '';
      if (currentVersion) {
        localStorage.setItem('lastSeenVersion', currentVersion);
        console.log('💾 Versión guardada en localStorage:', currentVersion);
      }

      // Recargar la página para obtener la nueva versión
      console.log('🔄 Recargando página...');
      window.location.reload();
    } catch (error) {
      console.error('❌ Error durante la actualización:', error);
      // Intentar recargar de todas formas
      window.location.reload();
    }
  }, [serviceWorkerRegistration]);

  // Función para descartar la actualización
  const dismissUpdate = useCallback(() => {
    setShowUpdateBanner(false);
    // Guardar que el usuario vio esta versión
    const currentVersion = import.meta.env.VITE_APP_VERSION || '';
    if (currentVersion) {
      localStorage.setItem('lastSeenVersion', currentVersion);
    }
  }, []);

  // Detectar actualizaciones del Service Worker
  useEffect(() => {
    // Función que se llama cuando se detecta una actualización
    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      console.log('🆕 Nueva versión detectada del Service Worker');
      setServiceWorkerRegistration(registration);
      setShowUpdateBanner(true);
    };

    // Exponer la función globalmente para que serviceWorkerRegistration.ts pueda llamarla
    (window as any).__UPDATE_AVAILABLE__ = handleUpdate;

    // Verificar cambio de versión basado en hash de build
    const checkVersion = () => {
      const currentVersion = import.meta.env.VITE_APP_VERSION || '';
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');

      console.log('🔍 Verificando versión:', {
        current: currentVersion,
        lastSeen: lastSeenVersion,
      });

      // Si hay una versión y es diferente a la última vista
      if (currentVersion && lastSeenVersion && lastSeenVersion !== currentVersion) {
        console.log('🆕 Nueva versión detectada por hash:', currentVersion);
        setShowUpdateBanner(true);
      } else if (!lastSeenVersion && currentVersion) {
        // Primera vez que se carga la app, guardar versión actual
        localStorage.setItem('lastSeenVersion', currentVersion);
      }
    };

    checkVersion();

    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
          console.log('📬 Mensaje del Service Worker: Nueva versión disponible');
          setShowUpdateBanner(true);
        }
      });

      // Verificar si hay un Service Worker en estado waiting
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          console.log('⏳ Service Worker en espera detectado');
          setServiceWorkerRegistration(registration);
          setShowUpdateBanner(true);
        }
      });
    }

    // Verificar versión cada 5 minutos
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      delete (window as any).__UPDATE_AVAILABLE__;
    };
  }, []);

  // Manejar controllerchange (cuando el SW se activa)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker actualizado, recargando página...');
        window.location.reload();
      });
    }
  }, []);

  return (
    <UpdateContext.Provider value={{ showUpdateBanner, triggerUpdate, dismissUpdate }}>
      {children}
      {showUpdateBanner && (
        <UpdateBanner onUpdate={triggerUpdate} onDismiss={dismissUpdate} />
      )}
    </UpdateContext.Provider>
  );
};
