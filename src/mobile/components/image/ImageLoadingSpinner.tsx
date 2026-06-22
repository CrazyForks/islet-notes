import { cx, styles } from '@/mobile/styles/ui';
import React from 'react';
import type { ImageLoadingTone } from './ImageLoading.types';

export function ImageLoadingSpinner({
  className,
  tone = 'muted',
}: {
  className?: string;
  tone?: ImageLoadingTone;
}) {
  return (
    <span
      className={cx(
        styles.ImageLoading.SpinnerBase,
        tone === 'light' ? styles.ImageLoading.SpinnerLight : styles.ImageLoading.SpinnerMuted,
        className,
      )}
      aria-hidden='true'
    />
  );
}
