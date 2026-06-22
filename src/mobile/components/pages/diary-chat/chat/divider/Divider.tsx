import { formatEntryTime } from '@/core/diary/selectors';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import React, { type CSSProperties } from 'react';

interface DividerMessageProps {
  timestamp: number;
  style?: CSSProperties;
}

export function DividerMessage({ timestamp, style }: DividerMessageProps) {
  return (
    <div className={styles.DividerMessage.Root} data-test-id={DiaryChat.divider} style={style}>
      <span className={styles.DividerMessage.Text}>{formatEntryTime(timestamp)}</span>
    </div>
  );
}
