import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import { formatAudioDuration } from '@/base/just-vibes/media-metrics';
import type { AudioAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { useEntryLongPressActions } from '@/mobile/hooks/useEntryLongPressActions';
import { useAttachmentAudioPlayback } from '@/mobile/hooks/useAttachmentAudioPlayback';
import type { LongPressMenuAction } from '@/mobile/overlay/longPressMenu/LongPressMenuController';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import {
  SPEECH_RECOGNITION_CONFIG_KEY,
  SPEECH_RECOGNITION_CONFIG_SWR_KEY,
  SpeechRecognitionConfigSchema,
} from '@/services/speechRecognition/common/speechRecognitionConfig';
import { ISpeechRecognitionService } from '@/services/speechRecognition/common/speechRecognitionService';
import { FileText, RefreshCw } from 'lucide-react';
import React from 'react';
import useSWR from 'swr';
import { AudioWaveIcon } from './AudioWaveIcon';
import { getAudioBubbleWidth } from './layout';

export interface AttachmentAudioProps {
  entryId: string;
  attachment: AudioAttachmentRecord;
  hasTranscript: boolean;
}

export function AttachmentAudio({ entryId, attachment, hasTranscript }: AttachmentAudioProps) {
  const speechRecognitionService = useService(ISpeechRecognitionService);
  const hostService = useService(IHostService);
  const { data: speechRecognitionConfig } = useSWR(SPEECH_RECOGNITION_CONFIG_SWR_KEY, async () =>
    hostService.getPreference(SPEECH_RECOGNITION_CONFIG_KEY, SpeechRecognitionConfigSchema),
  );
  const { failed, loading, playing, togglePlay } = useAttachmentAudioPlayback(attachment);
  const highlighted = useIsEntryHighlighted(entryId);

  // 长按菜单复用通用交互;音频专属的“识别/重新识别”作为额外动作传入。
  const recognizeAction: LongPressMenuAction | undefined = speechRecognitionConfig
    ? {
        id: 'recognize',
        label: hasTranscript
          ? localize('diary.voice.rerecognize', 'Transcribe again')
          : localize('diary.voice.recognize', 'Transcribe'),
        icon: hasTranscript ? RefreshCw : FileText,
        disabled: speechRecognitionService.isTranscribing(entryId),
        run: () => speechRecognitionService.recognize(entryId, attachment),
      }
    : undefined;
  const { anchorRef, longPressEvents } = useEntryLongPressActions<HTMLButtonElement>(entryId, {
    extraActions: recognizeAction ? [recognizeAction] : undefined,
  });

  return (
    <button
      ref={anchorRef}
      className={styles.ChatAudio.AudioMessage}
      type='button'
      data-test-id={DiaryChat.audioMessage}
      style={{ width: `${getAudioBubbleWidth(attachment.duration)}px` }}
      aria-label={formatAudioDuration(attachment.duration)}
      onClick={() => void togglePlay()}
      {...longPressEvents}
    >
      <span className={styles.ChatAudio.AudioDuration}>
        {formatAudioDuration(attachment.duration)}
      </span>
      {loading ? (
        <span className={styles.ChatAudio.AudioLoadingSpinner} aria-hidden='true' />
      ) : (
        <AudioWaveIcon
          playing={playing}
          className={failed ? styles.ChatAudio.AudioWaveFailed : undefined}
        />
      )}
      <EntryHighlightOverlay active={highlighted} tail />
    </button>
  );
}
