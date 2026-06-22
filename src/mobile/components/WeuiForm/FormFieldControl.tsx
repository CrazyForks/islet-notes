import { styles } from '@/mobile/styles/ui';
import type { FieldName, FormBoundField, FormValues } from '@/mobile/hooks/useForm';
import React, { ChangeEvent } from 'react';
import { FormFileControl } from './FormFileControl';
import { FormOptionControl } from './FormOptionControl';

export function FormFieldControl<T extends FormValues>({ field }: { field: FormBoundField<T> }) {
  const id = `form-${field.name}`;

  if (field.type === 'file') {
    return <FormFileControl field={field} id={id} />;
  }

  if (field.type === 'option') {
    return <FormOptionControl field={field} />;
  }

  if (field.type === 'checkbox') {
    return (
      <label className={styles.WeuiFormParts.ToggleRow} htmlFor={id}>
        <span>{field.label}</span>
        <input
          id={id}
          className={styles.Choice.Input}
          type='checkbox'
          data-test-id={field.testId}
          checked={Boolean(field.value)}
          disabled={field.disabled}
          onChange={(event) => field.onChange(event.target.checked as T[FieldName<T>])}
        />
      </label>
    );
  }

  return (
    <div className={styles.WeuiFormParts.FieldWrap}>
      <label className={styles.WeuiFormParts.FieldRow} htmlFor={id}>
        <span className={styles.WeuiFormParts.FieldLabel}>{field.label}</span>
        <input
          id={id}
          className={styles.WeuiFormParts.FieldInput}
          data-test-id={field.testId}
          type={field.type ?? 'text'}
          value={String(field.value ?? '')}
          placeholder={field.placeholder}
          disabled={field.disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            field.onChange(event.target.value as T[FieldName<T>])
          }
        />
      </label>
      {field.error && <p className={styles.WeuiFormParts.FieldError}>{field.error}</p>}
    </div>
  );
}
