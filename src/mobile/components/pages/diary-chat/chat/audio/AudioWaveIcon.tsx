import { cx, styles } from '@/mobile/styles/ui';
import { Wifi } from 'lucide-react';
import React from 'react';

export interface AudioWaveIconProps {
  playing: boolean;
  className?: string;
}

export function AudioWaveIcon({ playing, className }: AudioWaveIconProps) {
  return (
    <Wifi
      size={20}
      strokeWidth={2.1}
      className={cx(
        styles.ChatAudio.AudioWaveIcon,
        playing && styles.ChatAudio.AudioWavePlaying,
        className,
      )}
      aria-hidden='true'
    />
  );
}
