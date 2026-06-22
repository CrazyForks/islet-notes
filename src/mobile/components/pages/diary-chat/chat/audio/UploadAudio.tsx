import { formatAudioDuration } from '@/base/just-vibes/media-metrics';
import { useService } from '@/hooks/use-service';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import {
  AttachmentUploadTaskRecord,
  LOCAL_FILE_MISSING_ERROR_CODE,
} from '@/services/fileAsset/common/uploadTaskStore';
import React from 'react';
import { UploadFailureIndicator } from '../upload/UploadFailureIndicator';
import { AudioWaveIcon } from './AudioWaveIcon';
import { UploadAudioTranscript } from './UploadAudioTranscript';
import { getAudioBubbleWidth } from './layout';

interface UploadAudioMessageProps {
  task: AttachmentUploadTaskRecord;
}

export function UploadAudioMessage({ task }: UploadAudioMessageProps) {
  const fileAssetService = useService(IFileAssetService);
  const duration = task.duration ?? 0;
  const canRetry = task.status === 'failed' && task.errorCode !== LOCAL_FILE_MISSING_ERROR_CODE;
  const transcript = task.transcript?.trim();

  if (task.status === 'failed') {
    return (
      <div
        className={styles.ChatAudio.UploadAudioFailedRoot}
        data-test-id={DiaryChat.uploadMessage}
      >
        <div className={styles.ChatAudio.UploadFailedRow}>
          <UploadFailureIndicator
            mediaType='audio'
            canRetry={canRetry}
            errorMessage={task.errorMessage}
            onRetry={() => fileAssetService.retryAttachmentTask(task.id)}
            onDelete={() => fileAssetService.deleteAttachmentTask(task.id)}
          />
          <div
            className={styles.ChatAudio.AudioMessage}
            style={{ width: `${getAudioBubbleWidth(duration)}px` }}
          >
            <span className={styles.ChatAudio.AudioDuration}>{formatAudioDuration(duration)}</span>
            <AudioWaveIcon playing={false} />
          </div>
        </div>
        {transcript && <UploadAudioTranscript text={transcript} />}
      </div>
    );
  }

  return (
    <div className={styles.ChatAudio.AudioMessageStack} data-test-id={DiaryChat.uploadMessage}>
      <div className={styles.ChatAudio.UploadAudioRow}>
        <span
          className={styles.ChatAudio.UploadSendingSpinner}
          data-test-id={DiaryChat.uploadAudioSending}
          aria-label={localize('common.uploading', 'Uploading...')}
        />
        <div
          className={styles.ChatAudio.UploadAudioBubble}
          style={{ width: `${getAudioBubbleWidth(duration)}px` }}
        >
          <span className={styles.ChatAudio.AudioDuration}>{formatAudioDuration(duration)}</span>
          <AudioWaveIcon playing={false} />
        </div>
      </div>
      {transcript ? <UploadAudioTranscript text={transcript} /> : null}
    </div>
  );
}
