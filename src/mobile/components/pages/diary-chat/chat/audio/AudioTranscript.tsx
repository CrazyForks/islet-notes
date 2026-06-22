import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import { useService } from '@/hooks/use-service';
import { useLongPress } from '@/mobile/hooks/useLongPress';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useLongPressMenu } from '@/mobile/overlay/longPressMenu/useLongPressMenu';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTextInputDialog } from '@/mobile/overlay/textInputDialog/useTextInputDialog';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IHostService } from '@/services/native/common/hostService';
import { Copy, Edit3, Trash2 } from 'lucide-react';
import React, { useRef } from 'react';

export interface AudioTranscriptProps {
  entryId: string;
  text: string;
}

export function AudioTranscript({ entryId, text }: AudioTranscriptProps) {
  const diaryService = useService(IDiaryService);
  const hostService = useService(IHostService);
  const showDialog = useDialog();
  const showLongPressMenu = useLongPressMenu();
  const showSuccessToast = useSuccessToast();
  const showTextInputDialog = useTextInputDialog();
  const anchorRef = useRef<HTMLDivElement>(null);
  const highlighted = useIsEntryHighlighted(entryId);

  const copyText = async () => {
    try {
      await hostService.writeToClipboard(text);
      showSuccessToast({ message: localize('common.copied', 'Copied') });
    } catch {
      showSuccessToast({ message: localize('common.copyFailed', 'Copy failed') });
    }
  };

  const openEditDialog = () => {
    showTextInputDialog({
      title: localize('diary.voice.editTranscript', 'Edit transcript'),
      value: text,
      placeholder: localize('diary.edit.placeholder', 'Enter text'),
      saveLabel: localize('common.save', 'Save'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      rootTestId: DiaryChat.editTextDialog,
      inputTestId: DiaryChat.editTextInput,
      saveTestId: DiaryChat.editTextSave,
      cancelTestId: DiaryChat.editTextCancel,
      onSave: (nextText) => {
        if (nextText !== text.trim()) {
          diaryService.updateAttachmentEntryText(entryId, nextText);
        }
      },
    });
  };

  const confirmDeleteText = () => {
    showDialog({
      message: localize('diary.voice.deleteTranscriptConfirm', 'Delete this text?'),
      confirmLabel: localize('common.delete', 'Delete'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      tone: 'danger',
      onConfirm: () => {
        diaryService.updateAttachmentEntryText(entryId, undefined);
        showSuccessToast({ message: localize('diary.voice.transcriptDeleted', 'Deleted') });
      },
    });
  };

  const openMenu = () => {
    const root = anchorRef.current;
    if (!root) return;
    hostService.vibrateShort();
    showLongPressMenu({
      anchorRect: root.getBoundingClientRect(),
      actions: [
        {
          id: 'copy',
          label: localize('common.copy', 'Copy'),
          icon: Copy,
          run: copyText,
        },
        {
          id: 'edit',
          label: localize('common.edit', 'Edit'),
          icon: Edit3,
          run: openEditDialog,
        },
        {
          id: 'delete',
          label: localize('common.delete', 'Delete'),
          icon: Trash2,
          run: confirmDeleteText,
        },
      ],
    });
  };
  const { longPressEvents } = useLongPress<HTMLDivElement>(openMenu, undefined, {
    enabled: !!text,
  });

  return (
    <div
      ref={anchorRef}
      className={styles.ChatAudio.AudioTranscript}
      data-test-id={DiaryChat.audioTranscript}
      {...longPressEvents}
    >
      {text}
      <EntryHighlightOverlay active={highlighted} />
    </div>
  );
}
