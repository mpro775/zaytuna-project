export interface SyncChange {
  entity: string;
  operation: 'create' | 'update' | 'delete';
  id: string;
  data: any;
  timestamp: Date;
  version?: number;
  userId?: string;
}

export interface SyncResult {
  success: boolean;
  changesUploaded: number;
  changesDownloaded: number;
  conflicts: number;
  errors: string[];
  lastSyncTime: Date;
}

export interface DeviceConfig {
  deviceId: string;
  syncEnabled: boolean;
  syncInterval: number;
  maxBatchSize: number;
  supportedEntities: string[];
  offlineTimeout: number;
}

export interface Conflict {
  id: string;
  entity: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  conflictType: 'version' | 'data' | 'deletion';
  timestamp: Date;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge' | 'manual';
  resolvedData?: any;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'local' | 'server' | 'merge' | 'manual';
  resolvedData?: any;
  timestamp?: Date;
  strategy?: string;
  analysis?: any;
}

export interface QueueItem {
  id: string;
  operation: import('./IndexedDBService').SyncOperation;
  priority: number;
  attempts: number;
  lastAttempt?: Date;
  nextAttempt?: Date;
  error?: string;
}

// WebSocket types
export interface EntityUpdate {
  entity: string;
  entityId?: string;
  data: any;
  timestamp: Date;
  sourceUserId?: string;
}

export interface SyncNotification {
  type: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

// Conflict Resolution types
export interface ConflictDifference {
  field: string;
  localValue: any;
  serverValue: any;
  type: 'value_change' | 'type_change' | 'field_added' | 'field_removed' | 'array_item_added' | 'array_item_removed';
  significance: 'low' | 'medium' | 'high';
  fieldCategory: 'core' | 'metadata' | 'relations' | 'computed';
}

export interface ConflictAnalysis {
  entityType: string;
  entityId: string;
  localVersion: LocalEntity;
  serverVersion: any;
  differences: ConflictDifference[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: ConflictResolution['resolution'];
  reason: string;
  riskAssessment: {
    dataLoss: 'none' | 'low' | 'medium' | 'high';
    businessImpact: 'none' | 'low' | 'medium' | 'high';
    userImpact: 'none' | 'low' | 'medium' | 'high';
  };
}

export interface SmartResolutionStrategy {
  name: string;
  description: string;
  applicableTo: string[]; // أنواع الكيانات التي تنطبق عليها
  priority: number; // أولوية الاستراتيجية (الأعلى أولاً)
  canAutoResolve: boolean;
  resolver: (analysis: ConflictAnalysis) => ConflictResolution | null;
}

// Local Entity type
export interface LocalEntity {
  id: string;
  [key: string]: any;
}
