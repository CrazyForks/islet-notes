import {
  estimateVideoUploadSize,
  formatMediaSizeMb,
  formatVideoPreviewDuration,
} from '@/base/just-vibes/media-metrics';
import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { VideoPlayer } from '@/mobile/components/video/VideoPlayer';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { cx, styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import { Play, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { VideoPreviewController } from './VideoPreviewController';

// 视频预览半屏 overlay(WeUI 半屏弹窗风格):拖动条 + 标题/关闭;封面 + 播放键,点了才内联播放;
// 支持平台按需展示原画质选项,底部展示预估大小,取消/确认保存(样式四)。
export function VideoPreview() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  const hostService = useService(IHostService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<VideoPreviewController>(
    OverlayEnum.videoPreview,
  );
  const [originalQuality, setOriginalQuality] = useState(false);
  const [playing, setPlaying] = useState(false);
  const handleClickBackground = useCallback(() => {
    controller?.cancel();
  }, [controller]);
  useBackButton(controller ? handleClickBackground : undefined);

  // 每次打开新的预览都重置勾选与播放状态。
  useEffect(() => {
    setOriginalQuality(false);
    setPlaying(false);
  }, [controller]);

  if (!controller) return null;
  const video = controller.video;
  const videoTranscodeSupported = hostService.caniuse('videoTranscode');
  const effectiveOriginalQuality = !videoTranscodeSupported || originalQuality;
  const portrait = video.height > video.width;
  const uploadSize = estimateVideoUploadSize({
    sourceSize: video.size,
    durationMs: video.durationMs,
    originalQuality: effectiveOriginalQuality,
  });
  const duration = formatVideoPreviewDuration(video.durationMs);
  const sizeValue = effectiveOriginalQuality
    ? formatMediaSizeMb(video.size)
    : formatMediaSizeMb(uploadSize);
  const sizeSuffix = effectiveOriginalQuality
    ? localize('diary.video.originalSize', 'original')
    : localize('diary.video.compressed', 'compressed');

  return (
    <div
      className={styles.VideoPreview.Root}
      style={{ zIndex: controller.zIndex }}
      role='dialog'
      aria-modal='true'
      data-test-id={DiaryChat.videoPreviewSheet}
    >
      <div
        className={styles.VideoPreview.Backdrop}
        aria-hidden='true'
        onClick={handleClickBackground}
      />
      <div className={styles.VideoPreview.Sheet}>
        <div className={styles.VideoPreview.Header}>
          <span className={styles.VideoPreview.Title}>
            {localize('diary.video.preview', 'Preview')}
          </span>
          <button
            type='button'
            className={styles.VideoPreview.CloseButton}
            aria-label={localize('common.close', 'Close')}
            onClick={handleClickBackground}
          >
            <X size={22} />
          </button>
        </div>
        <div
          className={cx(
            styles.VideoPreview.MediaFrame,
            portrait
              ? styles.VideoPreview.MediaFramePortrait
              : styles.VideoPreview.MediaFrameLandscape,
          )}
          data-test-id={DiaryChat.videoPreviewMediaFrame}
        >
          {playing && video.webPath ? (
            <div
              className={
                portrait
                  ? styles.VideoPreview.PlayerBoxPortrait
                  : styles.VideoPreview.PlayerBoxLandscape
              }
            >
              <VideoPlayer url={video.webPath} />
            </div>
          ) : (
            <button
              type='button'
              className={styles.VideoPreview.PlayButton}
              data-test-id={DiaryChat.videoPreviewPlay}
              onClick={() => setPlaying(true)}
              aria-label={localize('diary.video.preview', 'Preview')}
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt=''
                  className={cx(
                    styles.VideoPreview.Thumbnail,
                    portrait
                      ? styles.VideoPreview.ThumbnailPortrait
                      : styles.VideoPreview.ThumbnailLandscape,
                  )}
                />
              ) : (
                <span
                  className={cx(
                    styles.VideoPreview.ThumbnailFallback,
                    portrait
                      ? styles.VideoPreview.ThumbnailFallbackPortrait
                      : styles.VideoPreview.ThumbnailFallbackLandscape,
                  )}
                />
              )}
              <span className={styles.VideoPreview.PlayOverlay}>
                <span className={styles.VideoPreview.PlayIconBox}>
                  <Play
                    size={24}
                    fill='#ffffff'
                    color='#ffffff'
                    className={styles.VideoPreview.PlayIcon}
                  />
                </span>
              </span>
              {duration ? (
                <span className={styles.VideoPreview.DurationBadge}>{duration}</span>
              ) : null}
            </button>
          )}
        </div>
        {videoTranscodeSupported && (
          <label className={styles.VideoPreview.CheckboxRow}>
            <input
              type='checkbox'
              className={styles.Choice.CheckboxCircle}
              checked={originalQuality}
              onChange={(event) => setOriginalQuality(event.target.checked)}
              data-test-id={DiaryChat.videoOriginalQuality}
            />
            <span>{localize('diary.video.originalQuality', 'Save original (no compression)')}</span>
          </label>
        )}
        <div
          className={cx(
            styles.VideoPreview.EstimateRow,
            videoTranscodeSupported
              ? styles.VideoPreview.EstimateRowWithCheckbox
              : styles.VideoPreview.EstimateRowStandalone,
          )}
        >
          <span className={styles.VideoPreview.EstimateLabel}>
            {localize('diary.video.estimatedSize', 'Estimated size')}
          </span>
          <span className={styles.VideoPreview.EstimateValue}>
            <span className={styles.VideoPreview.EstimateNumber}>{sizeValue}</span>
            <span className={styles.VideoPreview.EstimateSuffix}>{sizeSuffix}</span>
          </span>
        </div>
        <div className={styles.VideoPreview.Actions}>
          <button
            type='button'
            className={styles.VideoPreview.CancelButton}
            data-test-id={DiaryChat.videoPreviewCancel}
            onClick={handleClickBackground}
          >
            {localize('common.cancel', 'Cancel')}
          </button>
          <button
            type='button'
            className={styles.VideoPreview.ConfirmButton}
            data-test-id={DiaryChat.videoPreviewConfirm}
            onClick={() => controller.confirm(effectiveOriginalQuality)}
          >
            {localize('diary.video.confirmSave', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
