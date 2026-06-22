import { styles } from '@/mobile/styles/ui';
import React from 'react';

export function CalendarRecordText({ text }: { text: string }) {
  return <p className={styles.CalendarRecordText.Root}>{text}</p>;
}
