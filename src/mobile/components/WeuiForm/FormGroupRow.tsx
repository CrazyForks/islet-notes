import type { FormValues } from '@/mobile/hooks/useForm';
import React from 'react';
import { FormFieldControl } from './FormFieldControl';
import { FormNavigationRow } from './FormNavigationRow';
import { FormReadonlyRow } from './FormReadonlyRow';
import type { FormGroupItem } from './WeuiForm.types';
import { isFormNavigationItem } from './WeuiForm.utils';

export function FormGroupRow<T extends FormValues>({
  item,
  readonly,
}: {
  item: FormGroupItem<T>;
  readonly?: boolean;
}) {
  if (isFormNavigationItem(item)) {
    return <FormNavigationRow item={item} />;
  }
  if (readonly || !('onChange' in item)) {
    return <FormReadonlyRow item={item} />;
  }
  return <FormFieldControl field={item} />;
}
