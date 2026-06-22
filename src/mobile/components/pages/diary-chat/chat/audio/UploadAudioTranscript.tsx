import { styles } from '@/mobile/styles/ui';
import React from 'react';

export function UploadAudioTranscript({ text }: { text: string }) {
  return <div className={styles.ChatAudio.AudioTranscript}>{text}</div>;
}
