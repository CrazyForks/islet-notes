import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInputDialogController } from './TextInputDialogController';

export function TextInputDialogContent({ controller }: { controller: TextInputDialogController }) {
  const [value, setValue] = useState(() => controller.value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleCancel = useCallback(() => {
    controller.cancel();
  }, [controller]);
  useBackButton(handleCancel);

  useEffect(() => {
    setValue(controller.value);
    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(controller.value.length, controller.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [controller]);

  const normalizedValue = value.trim();
  const canSave = normalizedValue.length > 0;

  return (
    <div
      className={styles.TextInputDialog.Root}
      role='dialog'
      aria-modal='true'
      aria-labelledby='text-input-dialog-title'
      data-test-id={controller.rootTestId}
      style={{ zIndex: controller.zIndex }}
    >
      <div className={styles.TextInputDialog.Backdrop} aria-hidden='true' onClick={handleCancel} />
      <div className={styles.TextInputDialog.Sheet}>
        <div className={styles.TextInputDialog.Header}>
          <span id='text-input-dialog-title' className={styles.TextInputDialog.Title}>
            {controller.title}
          </span>
          <button
            type='button'
            className={styles.TextInputDialog.CloseButton}
            aria-label={localize('common.close', 'Close')}
            onClick={handleCancel}
          >
            <X size={22} />
          </button>
        </div>
        <div className={styles.TextInputDialog.FieldWrap}>
          <textarea
            ref={textareaRef}
            className={styles.TextInputDialog.Textarea}
            data-test-id={controller.inputTestId}
            value={value}
            rows={5}
            placeholder={controller.placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <div className={styles.TextInputDialog.Actions}>
          <button
            className={styles.TextInputDialog.CancelButton}
            type='button'
            data-test-id={controller.cancelTestId}
            onClick={handleCancel}
          >
            {controller.cancelLabel}
          </button>
          <button
            className={styles.TextInputDialog.SaveButton}
            type='button'
            data-test-id={controller.saveTestId}
            disabled={!canSave}
            onClick={() => controller.save(normalizedValue)}
          >
            {controller.saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
