import { WeuiFormHeader } from '@/mobile/components/WeuiForm';
import { cx, styles } from '@/mobile/styles/ui';
import React, { ReactNode } from 'react';

export interface FormPageAction {
  label: string;
  /** primary 绿色主按钮(默认) / default 灰色次按钮 / warn 红色危险按钮 */
  variant?: 'primary' | 'default' | 'warn';
  disabled?: boolean;
  testId?: string;
  onClick: () => void;
}

interface FormPageProps {
  /** 顶部居中大标题 */
  title: string;
  /** 标题下的灰色描述 */
  description?: string;
  /** 中部内容:字段分组、密钥展示、导航行列表 */
  children?: ReactNode;
  /** 操作区上方的勾选确认(「我已备份恢复密钥」) */
  check?: {
    label: string;
    checked: boolean;
    testId?: string;
    onChange: (checked: boolean) => void;
  };
  /** 操作按钮,自上而下按传入顺序排列 */
  actions?: FormPageAction[];
  testId?: string;
}

const ACTION_VARIANT_CLASS = {
  primary: styles.WeuiButton.Primary,
  default: styles.WeuiButton.Default,
  warn: styles.WeuiButton.Warn,
} as const;

export function FormPage({ title, description, children, check, actions, testId }: FormPageProps) {
  return (
    <section className={styles.WeuiForm.Root} data-test-id={testId}>
      <WeuiFormHeader title={title} description={description} />
      <div className={styles.WeuiForm.ControlArea}>{children}</div>
      {check && (
        <label className={styles.RecoveryKey.BackupLabel}>
          <input
            className={styles.Choice.CheckboxCircle}
            type='checkbox'
            data-test-id={check.testId}
            checked={check.checked}
            onChange={(event) => check.onChange(event.target.checked)}
          />
          <span>{check.label}</span>
        </label>
      )}
      {actions && actions.length > 0 && (
        <div className={cx(styles.WeuiForm.OprArea, styles.WeuiForm.OprStack)}>
          {actions.map((action, index) => (
            <button
              key={`${action.label}-${index}`}
              className={ACTION_VARIANT_CLASS[action.variant ?? 'primary']}
              type='button'
              data-test-id={action.testId}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
