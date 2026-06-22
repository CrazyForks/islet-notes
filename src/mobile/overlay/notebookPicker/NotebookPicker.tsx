import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { CoverInitial } from '@/mobile/components/CoverInitial';
import { CoverThumb } from '@/mobile/components/CoverThumb';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import { Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NotebookPickerController } from './NotebookPickerController';

export function NotebookPicker() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<NotebookPickerController>(
    OverlayEnum.notebookPicker,
  );
  const [query, setQuery] = useState('');
  const handleCancel = useCallback(() => {
    controller?.cancel();
  }, [controller]);
  useBackButton(controller ? handleCancel : undefined);

  useEffect(() => {
    setQuery('');
  }, [controller]);

  const filteredNotebooks = useMemo(() => {
    if (!controller) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return controller.notebooks;
    return controller.notebooks.filter((notebook) =>
      notebook.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [controller, query]);

  if (!controller) return null;

  const showSearch = controller.notebooks.length >= 8;

  return (
    <div
      className={styles.NotebookPicker.Root}
      role='dialog'
      aria-modal='true'
      aria-labelledby='notebook-picker-title'
      data-test-id={controller.rootTestId}
      style={{ zIndex: controller.zIndex }}
    >
      <div className={styles.NotebookPicker.Backdrop} aria-hidden='true' onClick={handleCancel} />
      <div className={styles.NotebookPicker.Sheet}>
        <div className={styles.NotebookPicker.Header}>
          <span id='notebook-picker-title' className={styles.NotebookPicker.Title}>
            {controller.title}
          </span>
          <button
            type='button'
            className={styles.NotebookPicker.CloseButton}
            aria-label={localize('common.close', 'Close')}
            data-test-id={controller.closeTestId}
            onClick={handleCancel}
          >
            <X size={22} />
          </button>
        </div>
        {showSearch && (
          <label className={styles.NotebookPicker.SearchBox}>
            <Search size={18} className={styles.NotebookPicker.SearchIcon} aria-hidden='true' />
            <input
              className={styles.NotebookPicker.SearchInput}
              data-test-id={controller.searchTestId}
              value={query}
              placeholder={localize('diary.moveEntry.searchPlaceholder', 'Search notebooks')}
              aria-label={localize('diary.moveEntry.searchPlaceholder', 'Search notebooks')}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}
        <div
          className={styles.NotebookPicker.List}
          role='listbox'
          data-test-id={controller.listTestId}
        >
          {filteredNotebooks.length > 0 ? (
            filteredNotebooks.map((notebook) => (
              <button
                key={notebook.id}
                type='button'
                className={styles.NotebookPicker.Item}
                role='option'
                aria-selected='false'
                data-test-id={controller.optionTestId}
                onClick={() => controller.select(notebook.id)}
              >
                {notebook.coverAttachment ? (
                  <CoverThumb
                    attachment={notebook.coverAttachment}
                    className={styles.NotebookPicker.ItemCover}
                  />
                ) : (
                  <CoverInitial
                    name={notebook.name}
                    className={styles.NotebookPicker.ItemCover}
                    textClassName={styles.NotebookPicker.ItemCoverText}
                  />
                )}
                <span className={styles.NotebookPicker.ItemName}>{notebook.name}</span>
              </button>
            ))
          ) : (
            <div className={styles.NotebookPicker.Empty}>
              {localize('diary.moveEntry.emptySearch', 'No matching notebooks')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
