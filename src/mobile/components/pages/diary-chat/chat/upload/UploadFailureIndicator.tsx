import { useActionSheet } from '@/mobile/overlay/actionSheet/useActionSheet';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import React from 'react';

export type UploadFailureMediaType = 'audio' | 'image' | 'video';

interface UploadFailureIndicatorProps {
  mediaType: UploadFailureMediaType;
  canRetry: boolean;
  errorMessage?: string;
  onRetry: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

export function UploadFailureIndicator({
  mediaType,
  canRetry,
  errorMessage,
  onRetry,
  onDelete,
}: UploadFailureIndicatorProps) {
  const showActionSheet = useActionSheet();
  const showDialog = useDialog();

  const openDeleteConfirm = () => {
    showDialog({
      title:
        mediaType === 'image'
          ? localize('diary.upload.deleteImageConfirmTitle', 'Delete this image')
          : mediaType === 'video'
            ? localize('diary.upload.deleteVideoConfirmTitle', 'Delete this video')
            : localize('diary.upload.deleteAudioConfirmTitle', 'Delete this audio'),
      message: localize(
        'diary.upload.deleteConfirmDescription',
        'Deleted items cannot be restored. Delete it?',
      ),
      confirmLabel: localize('common.delete', 'Delete'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      rootTestId: DiaryChat.uploadDeleteConfirm,
      confirmTestId: DiaryChat.uploadDeleteConfirmAction,
      onConfirm: onDelete,
    });
  };

  const openFailureSheet = () => {
    showActionSheet({
      title: localize('diary.upload.failed', 'Failed to send'),
      description: errorMessage,
      descriptionTestId: DiaryChat.uploadFailureReason,
      cancelLabel: localize('common.cancel', 'Cancel'),
      rootTestId: DiaryChat.uploadFailureSheet,
      actions: [
        ...(canRetry
          ? [
              {
                id: 'retry',
                label: localize('common.retry', 'Retry'),
                testId: DiaryChat.uploadRetry,
                run: onRetry,
              },
            ]
          : []),
        {
          id: 'delete',
          label: localize('common.delete', 'Delete'),
          tone: 'danger',
          testId: DiaryChat.uploadDelete,
          run: openDeleteConfirm,
        },
      ],
    });
  };

  return (
    <button
      className={styles.UploadFailureIndicator.Button}
      type='button'
      data-test-id={DiaryChat.uploadError}
      aria-label={localize('diary.upload.failed', 'Failed to send')}
      onClick={openFailureSheet}
    >
      <span aria-hidden='true'>!</span>
    </button>
  );
}
