import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import { env } from './config/environment';

// Initialize MSW based on environment configuration
async function enableMocking() {
  if (env.enableMSW) {
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