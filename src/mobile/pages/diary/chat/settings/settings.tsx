import { getAttachmentById, getNotebookById } from '@/core/diary/selectors';
import { localize } from '@/nls';
import { CellListGroup } from '@/mobile/components/CellList';
import { PageHeader } from '@/mobile/components/PageHeader';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { DiarySettings } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import {
  IFileAssetService,
  imageUploadResultToAttachment,
} from '@/services/fileAsset/common/fileAssetService';
import { ImagePickSource, IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatSettingsPage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const navigationService = useService(INavigationService);
  const showDialog = useDialog();
  const showLoadingToast = useLoadingToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;
  const coverCandidate = notebook?.avatarAttachmentId
    ? getAttachmentById(model, notebook.avatarAttachmentId)
    : undefined;
  const coverAttachment = coverCandidate?.type === 'image' ? coverCandidate : undefined;
  const coverUrl = useAttachmentThumbUrl(coverAttachment, { role: 'avatar' });

  if (!notebook || !notebookId) return isDeleting ? null : <Navigate to='/diaries' replace />;

  const pickCoverFromAlbum = async () => {
    if (coverUploading) return;
    let loadingToast: { dispose(): void } | undefined;
    try {
      const file = await hostService.pickImageBlob(ImagePickSource.Photos);
      if (!file) return;
      loadingToast = showLoadingToast({ message: localize('common.uploading', 'Uploading...') });
      setCoverUploading(true);
      const result = await fileAssetService.uploadImage(file, { thumbnail: true });
      const attachment = imageUploadResultToAttachment(result, notebookId);
      diaryService.addAttachment(attachment);
      diaryService.updateNotebookAvatar(notebookId, attachment.id);
    } catch {
      // 上传失败静默忽略,用户可重试
    } finally {
      loadingToast?.dispose();
      setCoverUploading(false);
    }
  };

  const confirmDeleteNotebook = () => {
    setIsDeleting(true);
    diaryService.softDeleteNotebook(notebookId);
    navigationService.navigate({ path: '/', replace: true });
  };

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={DiarySettings.page}>
      <PageHeader title={localize('diary.settings', 'Notebook settings')} showBack />
      <main
        className={cx(styles.Page.Content, styles.Cell.GroupStack)}
        data-test-id={DiarySettings.content}
      >
        <CellListGroup
          items={[
            {
              label: localize('diary.name', 'Notebook name'),
              right: { type: 'value', text: notebook.name },
              testId: DiarySettings.name,
              onClick: () => navigationService.navigate({ path: `/diary/${notebookId}/name` }),
            },
            {
              label: localize('diary.cover', 'Notebook cover'),
              right: coverUrl
                ? { type: 'image', url: coverUrl }
                : { type: 'initial', text: notebook.name },
              testId: DiarySettings.avatar,
              onClick: () => void pickCoverFromAlbum(),
            },
          ]}
        />
        <CellListGroup
          items={[
            {
              type: 'action',
              danger: true,
              label: localize('diary.deleteNotebook', 'Delete notebook'),
              testId: DiarySettings.deleteNotebook,
              onClick: () =>
                showDialog({
                  message: localize(
                    'diary.deleteNotebookConfirm',
                    'Delete this notebook? Entries in it will also be removed.',
                  ),
                  confirmLabel: localize('common.delete', 'Delete'),
                  cancelLabel: localize('common.cancel', 'Cancel'),
                  rootTestId: DiarySettings.deleteConfirm,
                  confirmTestId: DiarySettings.deleteConfirmAction,
                  cancelTestId: DiarySettings.deleteCancel,
                  onConfirm: confirmDeleteNotebook,
                }),
            },
          ]}
        />
      </main>
    </div>
  );
}
