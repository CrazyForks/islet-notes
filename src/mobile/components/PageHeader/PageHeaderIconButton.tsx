// @islet-import-scope same-dir

import { styles } from '@/mobile/styles/ui';
import { Ellipsis, Plus, RefreshCw, type LucideIcon } from 'lucide-react';
import React from 'react';
import type { PageHeaderIcon, PageHeaderIconItem } from './PageHeader.types';

const headerIconMap: Record<PageHeaderIcon, { Icon: LucideIcon; size: number }> = {
  ellipsis: { Icon: Ellipsis, size: 24 },
  plus: { Icon: Plus, size: 22 },
  refresh: { Icon: RefreshCw, size: 21 },
};

export function PageHeaderIconButton({ item }: { item: PageHeaderIconItem }) {
  if (item.hide) return null;
  const { Icon, size } = headerIconMap[item.icon];
  return (
    <button
      className={styles.Button.Icon}
      type='button'
      data-test-id={item.testId}
      title={item.label}
      aria-label={item.label}
      disabled={item.disabled || item.loading}
      onClick={item.onClick}
    >
      <Icon
        size={size}
        strokeWidth={item.icon === 'ellipsis' ? 2 : undefined}
        className={item.loading ? styles.Common.Spin : undefined}
      />
    </button>
  );
}
