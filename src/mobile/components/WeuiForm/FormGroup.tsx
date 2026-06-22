import { cx, styles } from '@/mobile/styles/ui';
import type { FormValues } from '@/mobile/hooks/useForm';
import React, { ReactNode } from 'react';
import { FormGroupRow } from './FormGroupRow';
import type { FormGroupItem } from './WeuiForm.types';
import { getFormItemKey } from './WeuiForm.utils';

export function FormGroup<T extends FormValues>({
  title,
  items,
  readonly,
  testId,
  className,
  children,
}: {
  items?: FormGroupItem<T>[];
  title?: string;
  readonly?: boolean;
  testId?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx(styles.WeuiForm.CellsGroup, className)} data-test-id={testId}>
      {title && <h2 className={styles.WeuiForm.CellsTitle}>{title}</h2>}
      <div className={styles.WeuiFormParts.GroupBody}>
        {items?.map((item) => (
          <FormGroupRow key={getFormItemKey(item)} item={item} readonly={readonly} />
        ))}
        {children}
      </div>
    </div>
  );
}
