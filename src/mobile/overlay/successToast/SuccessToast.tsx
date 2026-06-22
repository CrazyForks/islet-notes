import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import { Check } from 'lucide-react';
import React from 'react';
import { SuccessToastController } from './SuccessToastController';

export function SuccessToast() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<SuccessToastController>(
    OverlayEnum.successToast,
  );
  useWatchEvent(controller?.onStatusChange);

  if (!controller) return null;

  const iconless = controller.icon === 'none';

  return (
    <div
      className={styles.Toast.RootPassive}
      role='status'
      aria-live='polite'
      data-test-id={controller.testId}
      style={{ zIndex: controller.zIndex }}
    >
      <div className={iconless ? styles.Toast.BoxCompact : styles.Toast.Box}>
        {iconless ? (
          <span className={styles.Toast.Message}>{controller.message}</span>
        ) : (
          <div className={styles.Toast.Content}>
            <Check size={40} strokeWidth={1.5} aria-hidden='true' />
            <span className={styles.Toast.Message}>{controller.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
