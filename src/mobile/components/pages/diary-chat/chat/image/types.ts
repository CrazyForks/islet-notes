import type { ImageAttachmentRecord } from '@/core/diary/type';

export interface ImageMessageProps {
  entryId: string;
  attachment: ImageAttachmentRecord;
  previewAttachments: ImageAttachmentRecord[];
}
