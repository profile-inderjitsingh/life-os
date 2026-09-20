import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.href);

    navigator.serviceWorker.register(swUrl.href).catch(() => {
      /* Offline support is optional; the app works without it. */
    });
  });
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root was not found.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
