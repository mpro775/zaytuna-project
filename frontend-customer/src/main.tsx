import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pwaService } from './services/sync'

// تسجيل Service Worker عند بدء التطبيق
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await pwaService.registerServiceWorker();
      if (registration) {
        console.log('PWA initialized successfully');
      } else {
        console.warn('Service Worker registration returned null - may be disabled or unsupported');
      }
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
      // التطبيق يمكن أن يعمل بدون Service Worker
      console.info('Application will continue without PWA features');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
