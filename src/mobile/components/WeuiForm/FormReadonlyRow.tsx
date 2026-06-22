import { styles } from '@/mobile/styles/ui';
import type { FormBoundField, FormValues } from '@/mobile/hooks/useForm';
import React from 'react';
import type { FormReadonlyItem } from './WeuiForm.types';

export function FormReadonlyRow<T extends FormValues>({
  item,
}: {
  item: FormBoundField<T> | FormReadonlyItem;
}) {
  return (
    <div className={styles.WeuiFormParts.ReadonlyField} data-test-id={item.testId}>
      <span className={styles.WeuiFormParts.ReadonlyLabel}>{item.label}</span>
      <span className={styles.WeuiFormParts.ReadonlyValue}>{String(item.value ?? '')}</span>
    </div>
  );
}
