import { styles } from '@/mobile/styles/ui';
import type { FormBoundField, FormValues } from '@/mobile/hooks/useForm';
import { Check } from 'lucide-react';
import React from 'react';

export function FormOptionControl<T extends FormValues>({ field }: { field: FormBoundField<T> }) {
  return (
    <div className={styles.WeuiFormParts.FieldWrap}>
      {field.options?.map((option) => (
        <button
          key={String(option.value)}
          className={styles.WeuiFormParts.OptionRow}
          type='button'
          data-test-id={option.testId ?? field.testId}
          disabled={field.disabled || option.disabled}
          onClick={() => field.onChange(option.value)}
        >
          <span className={styles.WeuiFormParts.OptionLabel}>{option.label}</span>
          {Object.is(field.value, option.value) && (
            <Check size={24} className={styles.Cell.CheckIcon} strokeWidth={2.2} />
          )}
        </button>
      ))}
      {field.error && <p className={styles.WeuiFormParts.FieldError}>{field.error}</p>}
    </div>
  );
}
