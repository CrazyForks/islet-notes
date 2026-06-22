// @islet-import-scope same-dir

import { StepDots } from '@/mobile/components/StepDots';
import { styles } from '@/mobile/styles/ui';
import React from 'react';
import { PageHeaderIconButton } from './PageHeaderIconButton';
import type { PageHeaderRightItem } from './PageHeader.types';

export function PageHeaderRightItemView({ item }: { item: PageHeaderRightItem }) {
  if (item.hide) return null;

  if (item.type === 'button') {
    return (
      <button
        className={styles.Button.HeaderSave}
        type='button'
        data-test-id={item.testId}
        disabled={item.disabled || item.loading}
        onClick={item.onClick}
      >
        {item.label}
      </button>
    );
  }

  if (item.type === 'icon') {
    return <PageHeaderIconButton item={item} />;
  }

  return <StepDots total={item.total} current={item.current} />;
}
