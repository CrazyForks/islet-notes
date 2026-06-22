// @islet-import-scope same-dir

import React from 'react';
import { PageHeaderRightItemView } from './PageHeaderRightItemView';
import type { PageHeaderRight } from './PageHeader.types';

export function PageHeaderRightContent({ right }: { right?: PageHeaderRight }) {
  if (!right) return null;
  const items = Array.isArray(right) ? right : [right];
  return (
    <>
      {items.map((item, index) => (
        <PageHeaderRightItemView key={index} item={item} />
      ))}
    </>
  );
}
