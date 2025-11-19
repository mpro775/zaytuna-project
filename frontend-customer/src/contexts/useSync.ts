import { useContext } from 'react';
import SyncContext, { type SyncContextType } from './SyncContext';

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

