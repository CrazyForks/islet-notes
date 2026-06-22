import { cx, styles } from '@/mobile/styles/ui';
import React from 'react';

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className={styles.StepDots.Root} aria-hidden='true'>
      {Array.from({ length: total }, (_, index) => index + 1).map((step) => (
        <span
          key={step}
          className={cx(
            styles.StepDots.Dot,
            step <= current ? styles.StepDots.DotActive : styles.StepDots.DotInactive,
          )}
        />
      ))}
    </div>
  );
}
