import { cx, styles } from '@/mobile/styles/ui';
import React, { ReactNode } from 'react';

export interface TabButtonProps {
  label: string;
  icon: ReactNode;
  testId: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabButton({ label, icon, testId, isActive, onClick }: TabButtonProps) {
  return (
    <button
      className={cx(
        styles.BottomTabBar.Button,
        isActive ? styles.BottomTabBar.ButtonActive : styles.BottomTabBar.ButtonInactive,
      )}
      type='button'
      data-test-id={testId}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
    >
      {icon}
      <span className={styles.BottomTabBar.Label}>{label}</span>
    </button>
  );
}
