import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { ImageLoadingSpinner } from '@/mobile/components/image/ImageLoadingSpinner';
import { VideoPlayer } from '@/mobile/components/video/VideoPlayer';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import { X } from 'lucide-react';
import React, { useCallback } from 'react';
import { VideoPlayerController } from './VideoPlayerController';

// 视频播放弹窗 overlay：用 xgplayer 全屏播放，独立于图片预览。
export function VideoPlayerOverlay() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<VideoPlayerController>(
    OverlayEnum.videoPlayer,
  );
  useWatchEvent(controller?.onStatusChange);
  const handleClose = useCallback(() => {
    controller?.close();
  }, [controller]);
  useBackButton(controller ? handleClose : undefined);

  if (!controller) return null;

  return (
    <div
      className={styles.VideoPlayerOverlay.Root}
      style={{ zIndex: controller.zIndex }}
      role='dialog'
      aria-modal='true'
      data-test-id={DiaryChat.videoPlayerOverlay}
    >
      <button
        type='button'
        className={styles.VideoPlayerOverlay.CloseButton}
        data-test-id={DiaryChat.videoPlayerClose}
        aria-label={localize('common.cancel', 'Cancel')}
        onClick={handleClose}
      >
        <X size={22} />
      </button>
      {controller.status === 'failed' ? (
        <span className={styles.VideoPlayerOverlay.Hint}>
          {localize('diary.video.missing', 'Video is missing')}
        </span>
      ) : controller.status === 'ready' && controller.url ? (
        <VideoPlayer url={controller.url} />
      ) : (
        <ImageLoadingSpinner tone='light' />
      )}
    </div>
  );
}
