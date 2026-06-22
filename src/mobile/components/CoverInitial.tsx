import { cx, styles } from '@/mobile/styles/ui';
import React from 'react';

export function CoverInitial({
  name,
  className,
  textClassName,
}: {
  name: string;
  className?: string;
  textClassName?: string;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <span className={cx(styles.NotebookCover.Initial, className, textClassName)} aria-hidden='true'>
      {initial}
    </span>
  );
}
