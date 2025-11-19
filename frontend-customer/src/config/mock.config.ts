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
  const enabled = import.meta.env.VITE_USE_MOCK_DATA === 'true' || 
                  localStorage.getItem('mockDataEnabled') === 'true';
  
  return {
    enabled,
    delayMin: parseInt(import.meta.env.VITE_MOCK_DELAY_MIN || '100', 10),
    delayMax: parseInt(import.meta.env.VITE_MOCK_DELAY_MAX || '500', 10),
    errorRate: parseFloat(import.meta.env.VITE_MOCK_ERROR_RATE || '0'),
    persistData: true, // Store mock data changes in localStorage
  };
};

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
 * Check if mock mode is enabled
 */
export const isMockModeEnabled = (): boolean => {
  return mockConfig.enabled;
};

export default mockConfig;

