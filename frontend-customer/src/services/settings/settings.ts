import { api } from '../api';
import type { ApiResponse } from '../api';

// Settings types
export interface CompanySettings {
  id?: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  logo?: string;
  currency: string;
  timezone: string;
  language: string;
  fiscalYearStart: string; // MM-DD format
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
}

export interface SystemSettings {
  id?: string;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number; // days
  autoBackup: boolean;
  backupTime: string; // HH:MM format

  cacheEnabled: boolean;
  cacheTtl: number; // seconds

  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;

  security: {
    sessionTimeout: number; // minutes
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    passwordRequireNumbers: boolean;
    twoFactorEnabled: boolean;
    loginAttempts: number;
  };

  performance: {
    enableOptimization: boolean;
    maxConcurrentUsers: number;
    rateLimitEnabled: boolean;
    rateLimitMaxRequests: number;
  };
}

export interface SecuritySettings {
  id?: string;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
  };
  sessionManagement: {
    timeout: number; // minutes
    maxConcurrentSessions: number;
    forceLogoutOnPasswordChange: boolean;
  };
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    methods: ('sms' | 'email' | 'app')[];
  };
  loginSecurity: {
    maxAttempts: number;
    lockoutDuration: number; // minutes
    ipWhitelist: string[];
    ipBlacklist: string[];
  };
}

export interface BackupSettings {
  id?: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  retention: number; // days
  autoBackup: boolean;
  includeDatabase: boolean;
  includeFiles: boolean;
  includeLogs: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  destinations: {
    local: boolean;
    s3: boolean;
    ftp: boolean;
  };
}

// API functions
export const settingsApi = {
  // Company Settings
  getCompanySettings: async (): Promise<CompanySettings> => {
    const response = await api.get<ApiResponse<CompanySettings>>('/settings/company');
    return response.data.data;
  },

  updateCompanySettings: async (settings: CompanySettings): Promise<CompanySettings> => {
    const response = await api.patch<ApiResponse<CompanySettings>>('/settings/company', settings);
    return response.data.data;
  },

  uploadCompanyLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post<ApiResponse<{ logoUrl: string }>>('/settings/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // System Settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await api.get<ApiResponse<SystemSettings>>('/settings/system');
    return response.data.data;
  },

  updateSystemSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
    const response = await api.patch<ApiResponse<SystemSettings>>('/settings/system', settings);
    return response.data.data;
  },

  // Security Settings
  getSecuritySettings: async (): Promise<SecuritySettings> => {
    const response = await api.get<ApiResponse<SecuritySettings>>('/settings/security');
    return response.data.data;
  },

  updateSecuritySettings: async (settings: SecuritySettings): Promise<SecuritySettings> => {
    const response = await api.patch<ApiResponse<SecuritySettings>>('/settings/security', settings);
    return response.data.data;
  },

  // Backup Settings
  getBackupSettings: async (): Promise<BackupSettings> => {
    const response = await api.get<ApiResponse<BackupSettings>>('/settings/backup');
    return response.data.data;
  },

  updateBackupSettings: async (settings: BackupSettings): Promise<BackupSettings> => {
    const response = await api.patch<ApiResponse<BackupSettings>>('/settings/backup', settings);
    return response.data.data;
  },

  // Backup Operations
  createManualBackup: async (): Promise<{ backupId: string; status: string }> => {
    const response = await api.post<ApiResponse<{ backupId: string; status: string }>>('/settings/backup/manual');
    return response.data.data;
  },

  getBackupHistory: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/settings/backup/history');
    return response.data.data;
  },

  downloadBackup: async (backupId: string): Promise<Blob> => {
    const response = await api.get(`/settings/backup/download/${backupId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteBackup: async (backupId: string): Promise<void> => {
    await api.delete(`/settings/backup/${backupId}`);
  },

  // System Operations
  clearCache: async (): Promise<void> => {
    await api.post('/settings/system/clear-cache');
  },

  restartSystem: async (): Promise<void> => {
    await api.post('/settings/system/restart');
  },

  getSystemInfo: async (): Promise<{
    version: string;
    uptime: number;
    memoryUsage: { used: number; total: number };
    databaseSize: number;
    activeUsers: number;
  }> => {
    const response = await api.get<ApiResponse<any>>('/settings/system/info');
    return response.data.data;
  },

  // Configuration Validation
  validateSettings: async (settings: any, type: 'company' | 'system' | 'security' | 'backup'): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await api.post<ApiResponse<{ valid: boolean; errors: string[] }>>(`/settings/validate/${type}`, settings);
    return response.data.data;
  },

  // Reset to Defaults
  resetToDefaults: async (type: 'company' | 'system' | 'security' | 'backup'): Promise<void> => {
    await api.post(`/settings/reset/${type}`);
  },
};
