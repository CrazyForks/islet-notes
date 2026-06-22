import { styles } from '@/mobile/styles/ui';
import React from 'react';

interface TextInputRowProps {
  id: string;
  testId?: string;
  autoFocus?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextInputRow({
  id,
  testId,
  autoFocus,
  placeholder,
  value,
  onChange,
}: TextInputRowProps) {
  return (
    <label className={styles.Field.InputRow} htmlFor={id}>
      <input
        id={id}
        className={styles.Field.BareInput}
        data-test-id={testId}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
