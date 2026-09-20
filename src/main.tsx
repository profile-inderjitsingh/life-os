if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.href);

    navigator.serviceWorker.register(swUrl.href).catch(() => {
      /* Offline support is optional; the app works without it. */
    });
  });
}
