import type { FormBoundField, FormValues } from '@/mobile/hooks/useForm';
import type { ReactNode } from 'react';

export interface FormReadonlyItem {
  key?: string;
  label: string;
  value: string;
  testId?: string;
}

export interface FormNavigationItem {
  type: 'navigation';
  key?: string;
  icon: ReactNode;
  title: string;
  description?: string;
  testId: string;
  onClick: () => void;
}

export type FormGroupItem<T extends FormValues = FormValues> =
  | FormBoundField<T>
  | FormReadonlyItem
  | FormNavigationItem;
