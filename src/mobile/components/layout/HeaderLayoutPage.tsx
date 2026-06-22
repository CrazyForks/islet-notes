import { PageHeader } from '@/mobile/components/PageHeader';
import React, { ComponentProps, ReactNode } from 'react';

export interface HeaderLayoutPageProps {
  rootClassName: string;
  contentClassName: string;
  pageTestId?: string;
  contentTestId?: string;
  header: ComponentProps<typeof PageHeader>;
  children?: ReactNode;
}

export function HeaderLayoutPage({
  rootClassName,
  contentClassName,
  pageTestId,
  contentTestId,
  header,
  children,
}: HeaderLayoutPageProps) {
  return (
    <div className={rootClassName} data-test-id={pageTestId}>
      <PageHeader {...header} />
      <main className={contentClassName} data-test-id={contentTestId}>
        {children}
      </main>
    </div>
  );
}
