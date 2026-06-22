// @islet-import-scope same-dir

import { cx, styles } from '@/mobile/styles/ui';
import React from 'react';
import { CellListRows } from './CellListRows';
import type { CellListItem } from './CellList.types';

interface CellListGroupProps {
  items: CellListItem[];
  /** 顶部分组标题(如「存储」),无则不渲染 */
  title?: string;
  /** 分组上下带通栏细线(WeUI 卡片样式) */
  bordered?: boolean;
  testId?: string;
  className?: string;
}

export function CellListGroup({ items, title, bordered, testId, className }: CellListGroupProps) {
  const group = (
    <section
      className={cx(
        bordered ? styles.CellList.GroupBordered : styles.CellList.Group,
        styles.CellList.GroupDividers,
        !title && className,
      )}
      data-test-id={testId}
    >
      <CellListRows items={items} />
    </section>
  );
  if (!title) return group;
  return (
    <div className={className}>
      <h2 className={styles.CellList.GroupTitle}>{title}</h2>
      {group}
    </div>
  );
}
