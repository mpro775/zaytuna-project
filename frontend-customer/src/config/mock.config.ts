/**
 * Mock Data Configuration
 * Controls the mock data environment settings
 */

export interface MockConfig {
  enabled: boolean;
  delayMin: number;
  delayMax: number;
  errorRate: number;
  persistData: boolean;
}

const getMockConfig = (): MockConfig => {
  // Mock mode is enabled by default unless explicitly disabled
  // Check environment variable first, then localStorage, then default to true
  const envValue = import.meta.env.VITE_USE_MOCK_DATA;
  const localStorageValue = localStorage.getItem('mockDataEnabled');
  
  let enabled: boolean;
  
  if (envValue !== undefined) {
    // Environment variable takes precedence
    enabled = envValue === 'true';
  } else if (localStorageValue !== null) {
    // localStorage value if env var is not set
    enabled = localStorageValue === 'true';
  } else {
    // Default: enabled
    enabled = true;
  }
  
  return {
    enabled,
    delayMin: parseInt(import.meta.env.VITE_MOCK_DELAY_MIN || '100', 10),
    delayMax: parseInt(import.meta.env.VITE_MOCK_DELAY_MAX || '500', 10),
    errorRate: parseFloat(import.meta.env.VITE_MOCK_ERROR_RATE || '0'),
    persistData: true, // Store mock data changes in localStorage
  };
};

// Get initial config
export const mockConfig = getMockConfig();

/**
 * Enable or disable mock mode
 */
export const setMockMode = (enabled: boolean): void => {
  localStorage.setItem('mockDataEnabled', enabled.toString());
  if (enabled) {
    console.warn('⚠️ Mock Data Mode is ENABLED - All API calls will use mock data');
  } else {
    console.info('✅ Mock Data Mode is DISABLED - Using real API');
  }
  window.location.reload(); // Reload to apply changes
};

/**
 * Check if mock mode is enabled (dynamic check)
 */
export const isMockModeEnabled = (): boolean => {
  // Always check current state, not cached value
  const envValue = import.meta.env.VITE_USE_MOCK_DATA;
  const localStorageValue = typeof window !== 'undefined' ? localStorage.getItem('mockDataEnabled') : null;
  
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  
  if (localStorageValue !== null) {
    return localStorageValue === 'true';
  }
  
  // Default: enabled
  return true;
};

export default mockConfig;

