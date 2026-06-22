import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React from 'react';
import { TopTipsController } from './TopTipsController';

export function TopTips() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<TopTipsController>(OverlayEnum.topTips);
  useWatchEvent(controller?.onStatusChange);

  if (!controller) return null;

  return (
    <div
      className={styles.TopTips.Root}
      role='alert'
      data-test-id={controller.testId}
      style={{ zIndex: controller.zIndex }}
    >
      {controller.message}
    </div>
  );
}
