// @islet-import-scope same-dir

import React from 'react';
import { PageHeaderIconButton } from './PageHeaderIconButton';
import type { PageHeaderIconItem } from './PageHeader.types';

export function PageHeaderLeftContent({ left }: { left?: PageHeaderIconItem }) {
  if (!left) return null;
  return <PageHeaderIconButton item={left} />;
}
