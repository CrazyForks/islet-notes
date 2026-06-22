import type { FormValues } from '@/mobile/hooks/useForm';
import type { FormGroupItem, FormNavigationItem } from './WeuiForm.types';

export function getFormItemKey<T extends FormValues>(item: FormGroupItem<T>) {
  if (isFormNavigationItem(item)) return item.key ?? item.title;
  if (!('name' in item)) return item.key ?? item.label;
  return item.name;
}

export function isFormNavigationItem<T extends FormValues>(
  item: FormGroupItem<T>,
): item is FormNavigationItem {
  return 'type' in item && item.type === 'navigation' && 'onClick' in item;
}

export function getFileName(value: unknown) {
  if (typeof File === 'undefined' || !(value instanceof File)) return undefined;
  return value.name;
}
