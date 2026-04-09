import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensive check for environments where window.fetch is read-only
if (typeof window !== 'undefined') {
  try {
    // Provide a safe 'global' object that proxies to window
    // but prevents overwriting 'fetch' which can cause TypeErrors
    if (typeof (window as any).global === 'undefined') {
      (window as any).global = new Proxy(window, {
        set(target, prop, value) {
          if (prop === 'fetch') {
            console.warn('Blocked attempt to overwrite fetch via global object');
            return true; // Indicate success without actually setting
          }
          try {
            (target as any)[prop] = value;
          } catch (e) {
            console.warn(`Could not set property ${String(prop)} on global object`, e);
          }
          return true;
        },
        get(target, prop) {
          const value = (target as any)[prop];
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      });
    }
  } catch (e) {
    console.warn('Could not initialize safe global proxy', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
