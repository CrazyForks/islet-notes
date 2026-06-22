import { cx, styles } from '@/mobile/styles/ui';
import React, { CSSProperties } from 'react';
import { ImageLoadingSpinner } from './ImageLoadingSpinner';
import type { ImageLoadingTone } from './ImageLoading.types';

interface ImageLoadingPlaceholderProps {
  className?: string;
  style?: CSSProperties;
  spinnerTone?: ImageLoadingTone;
  testId?: string;
}

export function ImageLoadingPlaceholder({
  className,
  style,
  spinnerTone = 'muted',
  testId,
}: ImageLoadingPlaceholderProps) {
  return (
    <div
      className={cx(styles.ImageLoading.PlaceholderBase, className)}
      data-test-id={testId}
      style={style}
    >
      <ImageLoadingSpinner tone={spinnerTone} />
    </div>
  );
}
