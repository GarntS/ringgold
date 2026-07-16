(() => {
  if (!('serviceWorker' in navigator) || window.crossOriginIsolated || !window.isSecureContext || ['localhost', '127.0.0.1'].includes(location.hostname)) return;
  navigator.serviceWorker.register(new URL('sw.js', document.currentScript.src)).then((registration) => {
    if (!navigator.serviceWorker.controller) window.location.reload();
    registration.addEventListener('updatefound', () => window.location.reload());
  }).catch((error) => console.error('Cross-origin isolation service worker failed to register:', error));
})();
