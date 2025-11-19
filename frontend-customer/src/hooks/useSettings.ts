import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '@/services/settings';
import type {
  CompanySettings,
  SystemSettings,
  SecuritySettings,
  BackupSettings,
} from '@/services/settings';
import { toast } from 'react-hot-toast';

// Company Settings Hook
export const useCompanySettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: companySettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => settingsApi.getCompanySettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateCompanySettings,
    onSuccess: (updatedSettings) => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success(t('settings.messages.companyUpdated', 'تم تحديث إعدادات الشركة بنجاح'));
      return updatedSettings;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.companyUpdateFailed', 'فشل في تحديث إعدادات الشركة');
      toast.error(message);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: settingsApi.uploadCompanyLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success(t('settings.messages.logoUploaded', 'تم رفع شعار الشركة بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.logoUploadFailed', 'فشل في رفع شعار الشركة');
      toast.error(message);
    },
  });

  return {
    companySettings,
    isLoading,
    error,
    refetch,
    isUpdating: updateMutation.isPending,
    isUploadingLogo: uploadLogoMutation.isPending,
    updateCompanySettings: updateMutation.mutate,
    uploadLogo: uploadLogoMutation.mutate,
  };
};

// System Settings Hook
export const useSystemSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: systemSettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => settingsApi.getSystemSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateSystemSettings,
    onSuccess: (updatedSettings) => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success(t('settings.messages.systemUpdated', 'تم تحديث إعدادات النظام بنجاح'));
      return updatedSettings;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.systemUpdateFailed', 'فشل في تحديث إعدادات النظام');
      toast.error(message);
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: settingsApi.clearCache,
    onSuccess: () => {
      toast.success(t('settings.messages.cacheCleared', 'تم مسح الكاش بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.cacheClearFailed', 'فشل في مسح الكاش');
      toast.error(message);
    },
  });

  const restartSystemMutation = useMutation({
    mutationFn: settingsApi.restartSystem,
    onSuccess: () => {
      toast.success(t('settings.messages.systemRestarted', 'تم إعادة تشغيل النظام بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.systemRestartFailed', 'فشل في إعادة تشغيل النظام');
      toast.error(message);
    },
  });

  const {
    data: systemInfo,
    isLoading: isLoadingInfo,
    refetch: refetchInfo,
  } = useQuery({
    queryKey: ['system-info'],
    queryFn: () => settingsApi.getSystemInfo(),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    systemSettings,
    systemInfo,
    isLoading,
    isLoadingInfo,
    error,
    refetch,
    refetchInfo,
    isUpdating: updateMutation.isPending,
    isClearingCache: clearCacheMutation.isPending,
    isRestarting: restartSystemMutation.isPending,
    updateSystemSettings: updateMutation.mutate,
    clearCache: clearCacheMutation.mutate,
    restartSystem: restartSystemMutation.mutate,
  };
};

// Security Settings Hook
export const useSecuritySettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: securitySettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['security-settings'],
    queryFn: () => settingsApi.getSecuritySettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateSecuritySettings,
    onSuccess: (updatedSettings) => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success(t('settings.messages.securityUpdated', 'تم تحديث إعدادات الأمان بنجاح'));
      return updatedSettings;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.securityUpdateFailed', 'فشل في تحديث إعدادات الأمان');
      toast.error(message);
    },
  });

  return {
    securitySettings,
    isLoading,
    error,
    refetch,
    isUpdating: updateMutation.isPending,
    updateSecuritySettings: updateMutation.mutate,
  };
};

// Backup Settings Hook
export const useBackupSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: backupSettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['backup-settings'],
    queryFn: () => settingsApi.getBackupSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateBackupSettings,
    onSuccess: (updatedSettings) => {
      queryClient.invalidateQueries({ queryKey: ['backup-settings'] });
      toast.success(t('settings.messages.backupUpdated', 'تم تحديث إعدادات النسخ الاحتياطي بنجاح'));
      return updatedSettings;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.backupUpdateFailed', 'فشل في تحديث إعدادات النسخ الاحتياطي');
      toast.error(message);
    },
  });

  const createManualBackupMutation = useMutation({
    mutationFn: settingsApi.createManualBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      toast.success(t('settings.messages.backupCreated', 'تم إنشاء النسخة الاحتياطية بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('settings.errors.backupCreateFailed', 'فشل في إنشاء النسخة الاحتياطية');
      toast.error(message);
    },
  });

  const {
    data: backupHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['backup-history'],
    queryFn: () => settingsApi.getBackupHistory(),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    backupSettings,
    backupHistory: backupHistory || [],
    isLoading,
    isLoadingHistory,
    error,
    refetch,
    refetchHistory,
    isUpdating: updateMutation.isPending,
    isCreatingBackup: createManualBackupMutation.isPending,
    updateBackupSettings: updateMutation.mutate,
    createManualBackup: createManualBackupMutation.mutate,
  };
};

// General Settings Hook (combines all)
export const useSettings = () => {
  const company = useCompanySettings();
  const system = useSystemSettings();
  const security = useSecuritySettings();
  const backup = useBackupSettings();

  return {
    company,
    system,
    security,
    backup,
    // Combined loading state
    isLoading: company.isLoading || system.isLoading || security.isLoading || backup.isLoading,
    // Combined error state
    hasError: !!(company.error || system.error || security.error || backup.error),
  };
};
