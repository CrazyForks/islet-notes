import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React from 'react';
import { LoadingToastController } from './LoadingToastController';

export function LoadingToast() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<LoadingToastController>(
    OverlayEnum.loadingToast,
  );
  useWatchEvent(controller?.onStatusChange);

  if (!controller) return null;

  return (
    <div
      className={styles.Toast.Root}
      role='status'
      aria-live='polite'
      style={{ zIndex: controller.zIndex }}
    >
      <div className={styles.Toast.Box}>
        <div className={styles.Toast.Content}>
          <span className={styles.Toast.Spinner} aria-hidden='true' />
          <span className={styles.Toast.Message}>{controller.message}</span>
        </div>
      </div>
    </div>
  );
}
