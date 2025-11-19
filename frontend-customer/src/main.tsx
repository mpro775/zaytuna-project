import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pwaService } from './services/sync'

// تسجيل Service Worker عند بدء التطبيق
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await pwaService.registerServiceWorker();
      console.log('PWA initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
