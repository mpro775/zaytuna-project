/**
 * Mock Data System
 * Main entry point for mock data functionality
 */

export * from './services';
export * from './types';
export { mockConfig, setMockMode, isMockModeEnabled } from '@/config/mock.config';

// Initialize mock services when mock mode is enabled
import { isMockModeEnabled } from '@/config/mock.config';

if (isMockModeEnabled()) {
  // Import services to register handlers
  import('./services');
  
  if (import.meta.env.DEV) {
    console.warn('⚠️ Mock Data Mode is ENABLED');
  }
}

