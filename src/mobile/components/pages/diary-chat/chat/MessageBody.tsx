import type { ImageAttachmentRecord } from '@/core/diary/type';
import React from 'react';
import { AudioMessage } from './audio/AudioMessage';
import { ImageMessage } from './image/main';
import { TextMessage } from './text/main';
import { UnknownAttachmentMessage } from './unknown/main';
import { UploadMessage } from './upload/main';
import { VideoMessage } from './video/main';
import type { ResolvedChatItem } from './utils';

export interface MessageBodyProps {
  resolved: Exclude<ResolvedChatItem, { type: 'divider' }>;
  previewAttachments: ImageAttachmentRecord[];
}

export function MessageBody({ resolved, previewAttachments }: MessageBodyProps) {
  switch (resolved.type) {
    case 'text':
      return <TextMessage entryId={resolved.entry.id} text={resolved.text} />;
    case 'image':
      return (
        <ImageMessage
          entryId={resolved.entry.id}
          attachment={resolved.attachment}
          previewAttachments={previewAttachments}
        />
      );
    case 'audio':
      return (
        <AudioMessage
          entryId={resolved.entry.id}
          attachment={resolved.attachment}
          transcript={resolved.entry.text}
        />
      );
    case 'video':
      return <VideoMessage entryId={resolved.entry.id} attachment={resolved.attachment} />;
    case 'upload':
      return <UploadMessage task={resolved.task} />;
    case 'unknown':
      return <UnknownAttachmentMessage kind={resolved.kind} />;
  }
}
