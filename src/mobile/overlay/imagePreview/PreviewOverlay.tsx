import { ImageLoadFailedPlaceholder } from '@/mobile/components/image/ImageLoadFailedPlaceholder';
import { ImageLoadingSpinner } from '@/mobile/components/image/ImageLoadingSpinner';
import { styles } from '@/mobile/styles/ui';
import React from 'react';

export function PreviewOverlay({ status }: { status: 'idle' | 'loading' | 'loaded' | 'failed' }) {
  if (status === 'failed') {
    return (
      <div className={styles.ImagePreview.OverlayRoot}>
        <ImageLoadFailedPlaceholder className={styles.ImagePreview.Failed} tone='light' />
      </div>
    );
  }

  if (status !== 'loaded') {
    return (
      <div className={styles.ImagePreview.OverlayRoot}>
        <span className={styles.ImagePreview.SpinnerBox}>
          <ImageLoadingSpinner className={styles.ImagePreview.Spinner} tone='light' />
        </span>
      </div>
    );
  }

  return null;
}
