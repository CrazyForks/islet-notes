import { formatMediaSizeMb, formatVideoDurationBadge } from '@/base/just-vibes/media-metrics';
import type { CalendarDayRecord } from '@/core/state/calendar';
import { useService } from '@/hooks/use-service';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useVideoPlayer } from '@/mobile/overlay/videoPlayer/useVideoPlayer';
import { styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { Play } from 'lucide-react';
import React from 'react';
import { CalendarRecordText } from './CalendarRecordText';

export function CalendarRecordVideo({ record }: { record: CalendarDayRecord }) {
  const fileAssetService = useService(IFileAssetService);
  const showToast = useSuccessToast();
  const showVideoPlayer = useVideoPlayer();
  const thumbnailUrl = useAttachmentThumbUrl(record.video, { role: 'thumbnail' });
  const sizeLabel = formatMediaSizeMb(record.video?.size);
  const durationBadge = formatVideoDurationBadge(record.video?.duration);
  const text = record.entry.text?.trim();

  const openPlayer = () => {
    const video = record.video;
    const s3Key = video?.s3Key;
    if (!s3Key) {
      showToast({
        message: localize('diary.video.missing', 'Video is missing'),
        icon: 'none',
      });
      return;
    }
    showVideoPlayer({
      loadUrl: () => fileAssetService.getFileUrl(s3Key, { role: 'large' }),
    });
  };

  return (
    <div className={styles.CalendarRecordVideo.Root}>
      <button
        className={styles.CalendarRecordVideo.PreviewBox}
        type='button'
        data-test-id={Calendar.recordVideoButton}
        onClick={openPlayer}
      >
        {thumbnailUrl ? (
          <img
            className={styles.CalendarRecordVideo.PreviewImage}
            data-test-id={Calendar.recordVideoThumbnail}
            src={thumbnailUrl}
            alt=''
          />
        ) : (
          <span
            className={styles.CalendarRecordVideo.PreviewPlaceholder}
            data-test-id={Calendar.recordVideoThumbnail}
            aria-hidden='true'
          />
        )}
        <span className={styles.CalendarRecordVideo.PlayBadge} aria-hidden='true'>
          <Play
            size={15}
            fill='#ffffff'
            color='#ffffff'
            className={styles.CalendarRecordVideo.PlayIcon}
          />
        </span>
        <span className={styles.CalendarRecordVideo.BottomOverlay}>
          <span className={styles.CalendarRecordVideo.SizeBadge}>{sizeLabel}</span>
          <span className={styles.CalendarRecordVideo.DurationBadge}>{durationBadge}</span>
        </span>
      </button>
      {text && <CalendarRecordText text={text} />}
    </div>
  );
}
