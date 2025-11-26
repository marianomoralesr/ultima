// Service Worker Registration Utility

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

interface Config {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    // Skip service worker in development to avoid caching issues
    if (isLocalhost && import.meta.env.DEV) {
      console.log('Service worker is disabled in development mode');
      return;
    }

    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Service worker won't work if PUBLIC_URL is on a different origin
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config): void {
  navigator.serviceWorker
    .register(swUrl, {
      scope: '/',
      updateViaCache: 'none'
    })
    .then((registration) => {
      // Check for updates every hour
      const intervalId = setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // 1 hour

      // Clean up interval on page unload
      window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
      });

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                'New content is available and will be used when all tabs for this page are closed.'
              );

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }

              // Notificar al UpdateProvider que hay una actualización disponible
              if (typeof (window as any).__UPDATE_AVAILABLE__ === 'function') {
                (window as any).__UPDATE_AVAILABLE__(registration);
              }
            } else {
              // At this point, everything has been precached.
              console.log('Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
      if (config && config.onError) {
        config.onError(error);
      }
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config): void {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Utility to clear all caches
export function clearAllCaches(): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }

  return caches.keys().then((names) => {
    return Promise.all(
      names.map((name) => {
        return caches.delete(name);
      })
    ).then(() => {
      console.log('All caches cleared');
    });
  });
}

// Utility to check if service worker is installed
export function isServiceWorkerInstalled(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
}

// Export registration function
export default {
  register,
  unregister,
  clearAllCaches,
  isServiceWorkerInstalled,
};