import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React from 'react';
import { TextInputDialogContent } from './TextInputDialogContent';
import { TextInputDialogController } from './TextInputDialogController';

// 文本编辑半屏弹窗(WeUI 半屏弹窗风格,与视频预览一致):底部贴边,标题/关闭 + 输入框 + 取消/保存。
export function TextInputDialog() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<TextInputDialogController>(
    OverlayEnum.textInputDialog,
  );

  if (!controller) return null;

  return <TextInputDialogContent key={controller.instanceId} controller={controller} />;
}
