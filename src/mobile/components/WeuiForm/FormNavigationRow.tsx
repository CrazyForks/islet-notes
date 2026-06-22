import { styles } from '@/mobile/styles/ui';
import { ChevronRight } from 'lucide-react';
import React from 'react';
import type { FormNavigationItem } from './WeuiForm.types';

export function FormNavigationRow({ item }: { item: FormNavigationItem }) {
  return (
    <button
      className={styles.WeuiFormParts.NavigationRow}
      type='button'
      data-test-id={item.testId}
      onClick={item.onClick}
    >
      <span className={styles.WeuiFormParts.NavigationIcon}>{item.icon}</span>
      <span className={styles.WeuiFormParts.NavigationBody}>
        <span className={styles.WeuiFormParts.NavigationTitle}>{item.title}</span>
        {item.description && <span className={styles.Text.Hint}>{item.description}</span>}
      </span>
      <ChevronRight
        size={20}
        strokeWidth={1.75}
        className={styles.WeuiFormParts.NavigationChevron}
      />
    </button>
  );
}
