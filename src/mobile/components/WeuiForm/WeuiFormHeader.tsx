import { styles } from '@/mobile/styles/ui';
import React from 'react';

export function WeuiFormHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className={styles.WeuiForm.TextArea}>
      <h2 className={styles.WeuiForm.Title}>{title}</h2>
      {description && <p className={styles.WeuiForm.Description}>{description}</p>}
    </div>
  );
}
