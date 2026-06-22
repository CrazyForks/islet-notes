import type { DiaryModelData, ImageAttachmentRecord } from '@/core/diary/type';
import { UserAvatar } from '@/mobile/components/UserAvatar';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import React, { type CSSProperties } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { DividerMessage } from './divider/main';
import { MessageBody } from './MessageBody';
import { resolveChatItem, type DiaryChatItem } from './utils';

export interface ChatMessageData {
  items: DiaryChatItem[];
  model: DiaryModelData;
  previewAttachments: ImageAttachmentRecord[];
}

export function ChatMessage({ index, style, data }: ListChildComponentProps<ChatMessageData>) {
  const item = data.items[index];
  const rowStyle: CSSProperties = { ...style, width: '100%' };
  const resolved = resolveChatItem(item, data.model);

  if (resolved.type === 'divider') {
    return <DividerMessage timestamp={resolved.timestamp} style={rowStyle} />;
  }

  return (
    <div className={styles.ChatMessage.RowRight} data-test-id={DiaryChat.row} style={rowStyle}>
      <MessageBody resolved={resolved} previewAttachments={data.previewAttachments} />
      <UserAvatar size={36} />
    </div>
  );
}
