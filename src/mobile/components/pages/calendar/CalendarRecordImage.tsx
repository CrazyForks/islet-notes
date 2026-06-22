import type { CalendarDayRecord } from '@/core/state/calendar';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useImagePreview } from '@/mobile/overlay/imagePreview/useImagePreview';
import { styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import React, { useRef } from 'react';

export function CalendarRecordImage({
  attachment,
  previewAttachments,
}: {
  attachment: NonNullable<CalendarDayRecord['image']>;
  previewAttachments: NonNullable<CalendarDayRecord['image']>[];
}) {
  const url = useAttachmentThumbUrl(attachment, { role: 'thumbnail' });
  const showImagePreview = useImagePreview();
  const originRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={originRef}
      className={styles.CalendarRecordImage.Button}
      type='button'
      data-test-id={Calendar.recordImageButton}
      onClick={() => {
        showImagePreview({
          attachments: previewAttachments.length ? previewAttachments : [attachment],
          initialAttachmentId: attachment.id,
          originRef,
        });
      }}
    >
      {url ? (
        <img
          className={styles.CalendarRecordImage.Image}
          data-test-id={Calendar.recordImage}
          src={url}
          alt=''
        />
      ) : (
        <span className={styles.CalendarRecordImage.Placeholder} />
      )}
    </button>
  );
}
