import { cx, styles } from '@/mobile/styles/ui';
import { Image as ImageIcon } from 'lucide-react';
import React from 'react';

export function CoverPlaceholder({
  className,
  iconSize = 16,
}: {
  className?: string;
  iconSize?: number;
}) {
  return (
    <span className={cx(styles.NotebookCover.Placeholder, className)} aria-hidden='true'>
      <ImageIcon size={iconSize} strokeWidth={1.6} />
    </span>
  );
}
