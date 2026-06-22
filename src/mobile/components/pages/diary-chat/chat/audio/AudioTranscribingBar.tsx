import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import React from 'react';

export function AudioTranscribingBar({ entryId }: { entryId: string }) {
  const highlighted = useIsEntryHighlighted(entryId);
  return (
    <div
      className={styles.ChatAudio.AudioTranscribing}
      data-test-id={DiaryChat.audioTranscribing}
      aria-label={localize('diary.voice.recognizing', 'Transcribing...')}
    >
      <span>{localize('diary.voice.recognizing', 'Transcribing...')}</span>
      <span className={styles.ChatAudio.AudioTranscribingDots} aria-hidden='true'>
        <i className={styles.ChatAudio.AudioTranscribeDot} />
        <i className={styles.ChatAudio.AudioTranscribeDot} style={{ animationDelay: '0.18s' }} />
        <i className={styles.ChatAudio.AudioTranscribeDot} style={{ animationDelay: '0.36s' }} />
      </span>
      <EntryHighlightOverlay active={highlighted} />
    </div>
  );
}
