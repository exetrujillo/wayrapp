import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

// Initialize MSW in development mode
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW !== 'false') {
    const { startMocking } = await import('./mocks/browser');
    return startMocking();
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});