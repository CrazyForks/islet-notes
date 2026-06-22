import { styles } from '@/mobile/styles/ui';
import type { FieldName, FormBoundField, FormValues } from '@/mobile/hooks/useForm';
import { localize } from '@/nls';
import { ChevronRight } from 'lucide-react';
import React, { ChangeEvent, useRef } from 'react';
import { getFileName } from './WeuiForm.utils';

export function FormFileControl<T extends FormValues>({
  field,
  id,
}: {
  field: FormBoundField<T>;
  id: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileName = getFileName(field.value);

  return (
    <div className={styles.WeuiFormParts.FieldWrap}>
      <input
        ref={inputRef}
        id={id}
        className={styles.WeuiFormParts.FileInput}
        data-test-id={field.inputTestId ?? field.testId}
        type='file'
        accept={field.accept}
        disabled={field.disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          field.onChange(event.target.files?.[0] as T[FieldName<T>]);
        }}
      />
      <button
        className={styles.WeuiFormParts.FileRow}
        type='button'
        data-test-id={field.testId}
        disabled={field.disabled}
        onClick={() => inputRef.current?.click()}
      >
        <span className={styles.WeuiFormParts.FieldLabel}>{field.label}</span>
        <span className={styles.WeuiFormParts.FileValue}>
          {fileName ?? localize('settings.import.chooseFile', 'Choose file')}
        </span>
        <ChevronRight size={18} className={styles.WeuiFormParts.FileChevron} strokeWidth={1.9} />
      </button>
      {field.error && <p className={styles.WeuiFormParts.FieldError}>{field.error}</p>}
    </div>
  );
}
