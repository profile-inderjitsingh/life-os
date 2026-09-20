import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing from index.html.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker so the app opens from the Home Screen offline.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Offline support is optional; the app works without it. */
    });
  });
}
