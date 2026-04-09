import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensive check for environments where window.fetch is read-only
if (typeof window !== 'undefined') {
  try {
    // Ensure 'global' is set which often prevents polyfill attempts
    (window as any).global = window;
    
    // If something tries to set window.fetch, we want to prevent the TypeError
    // by providing a no-op setter if it's currently a getter-only property.
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch') || 
                       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');
    
    if (descriptor && descriptor.get && !descriptor.set) {
      const originalFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        get() { return originalFetch; },
        set() { console.warn('Blocked attempt to overwrite read-only window.fetch'); },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn('Could not protect fetch property on window', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
