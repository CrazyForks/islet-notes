// @islet-import-scope same-dir

import { styles } from '@/mobile/styles/ui';
import { UserRound } from 'lucide-react';
import React from 'react';
import type { CellListItemRight } from './CellList.types';

export function CellRight({ right }: { right: CellListItemRight }) {
  if (right.type === 'value') {
    return <span className={styles.Cell.RowValue}>{right.text}</span>;
  }
  if (right.type === 'image') {
    if (!right.url) {
      return (
        <span className={styles.CellList.RightImageFallback} aria-hidden='true'>
          <UserRound size={19} strokeWidth={1.8} />
        </span>
      );
    }
    return (
      <img
        className={styles.CellList.RightImage}
        data-test-id={right.testId}
        src={right.url}
        alt=''
      />
    );
  }
  return (
    <span className={styles.CellList.RightInitial} data-test-id={right.testId} aria-hidden='true'>
      {right.text.trim().slice(0, 1).toUpperCase() || '?'}
    </span>
  );
}
