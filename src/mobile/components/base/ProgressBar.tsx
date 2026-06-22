import { styles } from '@/mobile/styles/ui';
import React from 'react';

export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const progressPercent =
    total > 0 ? Math.min(100, Math.max(0, Math.round((completed / total) * 100))) : 0;

  return (
    <div
      className={styles.ProgressBar.Track}
      role='progressbar'
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(Math.max(completed, 0), Math.max(total, 0))}
    >
      <div className={styles.ProgressBar.Bar} style={{ width: `${progressPercent}%` }} />
    </div>
  );
}
