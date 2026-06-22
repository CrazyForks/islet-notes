import { formatAudioDuration } from '@/base/just-vibes/media-metrics';
import type { CalendarDayRecord } from '@/core/state/calendar';
import { getAudioBubbleWidth } from '@/mobile/components/pages/diary-chat/chat/audio/layout';
import { useAttachmentAudioPlayback } from '@/mobile/hooks/useAttachmentAudioPlayback';
import { cx, styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import { Wifi } from 'lucide-react';
import React from 'react';
import { CalendarRecordText } from './CalendarRecordText';

export function CalendarRecordAudio({
  attachment,
  text,
}: {
  attachment: NonNullable<CalendarDayRecord['audio']>;
  text?: string;
}) {
  const { failed, loading, playing, togglePlay } = useAttachmentAudioPlayback(attachment);
  const transcript = text?.trim();
  return (
    <div className={styles.CalendarRecordAudio.Root}>
      <button
        className={styles.CalendarRecordAudio.Button}
        type='button'
        data-test-id={Calendar.recordAudioButton}
        style={{ width: `${getAudioBubbleWidth(attachment.duration)}px` }}
        aria-label={formatAudioDuration(attachment.duration)}
        onClick={() => void togglePlay()}
      >
        <span className={styles.ChatAudio.AudioDuration}>
          {formatAudioDuration(attachment.duration)}
        </span>
        {loading ? (
          <span className={styles.ChatAudio.AudioLoadingSpinner} aria-hidden='true' />
        ) : (
          <Wifi
            size={20}
            strokeWidth={2.1}
            className={cx(
              styles.CalendarRecordAudio.WaveIcon,
              playing && styles.ChatAudio.AudioWavePlaying,
              failed && styles.ChatAudio.AudioWaveFailed,
            )}
            aria-hidden='true'
          />
        )}
      </button>
      {transcript && <CalendarRecordText text={transcript} />}
    </div>
  );
}
