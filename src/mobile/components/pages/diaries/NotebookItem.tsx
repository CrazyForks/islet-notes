import {
  getAttachmentById,
  getEntrySummary,
  getLastEntry,
  getNotebookListTime,
} from '@/core/diary/selectors';
import { formatNotebookListTime, getLocalTimeZone } from '@/core/format';
import type { DiaryModelData, NotebookRecord } from '@/core/diary/type';
import { CoverInitial } from '@/mobile/components/CoverInitial';
import { CoverThumb } from '@/mobile/components/CoverThumb';
import { DiaryList } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import React from 'react';

interface NotebookItemProps {
  model: DiaryModelData;
  notebook: NotebookRecord;
  onClick: () => void;
}

export function NotebookItem({ model, notebook, onClick }: NotebookItemProps) {
  const lastEntry = getLastEntry(model, notebook.id);
  const summary = getEntrySummary(model, lastEntry);
  const updatedAt = getNotebookListTime(model, notebook);
  const coverCandidate = notebook.avatarAttachmentId
    ? getAttachmentById(model, notebook.avatarAttachmentId)
    : undefined;
  const coverAttachment = coverCandidate?.type === 'image' ? coverCandidate : undefined;

  return (
    <button
      className={styles.NotebookItem.Root}
      type='button'
      data-test-id={DiaryList.notebookItem}
      onClick={onClick}
    >
      {coverAttachment ? (
        <CoverThumb attachment={coverAttachment} className={styles.NotebookItem.Cover} />
      ) : (
        <CoverInitial
          name={notebook.name}
          className={styles.NotebookItem.Cover}
          textClassName={styles.NotebookItem.CoverText}
        />
      )}
      <div className={styles.NotebookItem.Body}>
        <div className={styles.NotebookItem.TitleRow}>
          <span className={styles.NotebookItem.Name} data-test-id={DiaryList.notebookName}>
            {notebook.name}
          </span>
        </div>
        <div className={styles.NotebookItem.Summary}>
          {summary || localize('diary.notebook.emptySummary', 'No entries yet')}
        </div>
      </div>
      <span className={styles.NotebookItem.Time}>
        {updatedAt > 0 &&
          formatNotebookListTime({
            timestamp: updatedAt,
            currenttime: Date.now(),
            timezone: getLocalTimeZone(),
          })}
      </span>
    </button>
  );
}
