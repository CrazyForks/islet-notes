import {
  HeaderLayoutPage,
  type HeaderLayoutPageProps,
} from '@/mobile/components/layout/HeaderLayoutPage';
import { styles } from '@/mobile/styles/ui';
import React, { ReactNode } from 'react';

interface HeaderPageProps {
  pageTestId?: string;
  contentTestId?: string;
  header: HeaderLayoutPageProps['header'];
  children?: ReactNode;
}

export function HeaderPage({ pageTestId, contentTestId, header, children }: HeaderPageProps) {
  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.GroupedRoot}
      contentClassName={styles.Page.Content}
      pageTestId={pageTestId}
      contentTestId={contentTestId}
      header={header}
    >
      {children}
    </HeaderLayoutPage>
  );
}
