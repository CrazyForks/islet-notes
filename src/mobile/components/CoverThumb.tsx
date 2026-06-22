import { ImageAttachmentRecord } from '@/core/diary/type';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { cx, styles } from '@/mobile/styles/ui';
import React from 'react';

export function CoverThumb({
  attachment,
  className,
}: {
  attachment: ImageAttachmentRecord;
  className?: string;
}) {
  const url = useAttachmentThumbUrl(attachment, { role: 'avatar' });

  if (!url)
    return <span className={cx(styles.NotebookCover.Thumb, className)} aria-hidden='true' />;
  return <img className={cx(styles.NotebookCover.ThumbImage, className)} src={url} alt='' />;
}
