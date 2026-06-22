import { DiaryChat } from '@/mobile/test.id';
import { getImageMessageStyle } from './utils';
import React from 'react';
import { styles } from '@/mobile/styles/ui';
import { AttachmentImage } from './AttachmentImage';
import type { ImageMessageProps } from './types';

export function ImageMessage({ entryId, attachment, previewAttachments }: ImageMessageProps) {
  return (
    <div
      className={styles.ImageMessage.Root}
      data-test-id={DiaryChat.imageMessage}
      style={getImageMessageStyle(attachment.width, attachment.height)}
    >
      <AttachmentImage
        entryId={entryId}
        attachment={attachment}
        previewAttachments={previewAttachments}
      />
    </div>
  );
}
