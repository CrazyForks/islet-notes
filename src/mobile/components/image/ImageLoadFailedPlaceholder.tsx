import { cx, styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import React, { CSSProperties } from 'react';
import type { ImageLoadingTone } from './ImageLoading.types';

export function ImageLoadFailedPlaceholder({
  className,
  style,
  testId,
  label = localize('diary.image.loadFailed', 'Image failed to load'),
  tone = 'muted',
}: {
  className?: string;
  style?: CSSProperties;
  testId?: string;
  label?: string;
  tone?: ImageLoadingTone;
}) {
  return (
    <div
      className={cx(
        styles.ImageLoading.FailedBase,
        tone === 'light' ? styles.ImageLoading.FailedLight : styles.ImageLoading.FailedMuted,
        className,
      )}
      data-test-id={testId}
      style={style}
    >
      <span>{label}</span>
    </div>
  );
}
