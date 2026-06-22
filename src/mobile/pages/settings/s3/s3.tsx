import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { CloudSync } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import React from 'react';
import { Navigate } from 'react-router';
import { SyncManagementPage } from './sync-management/sync-management';

export function SettingsS3Page() {
  const fileAssetService = useService(IFileAssetService);
  useWatchEvent(fileAssetService.onDidChangeConfig);
  const config = fileAssetService.getSyncConfig();

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={CloudSync.page}>
      {config ? <SyncManagementPage config={config} /> : <Navigate to='/' replace />}
    </div>
  );
}
