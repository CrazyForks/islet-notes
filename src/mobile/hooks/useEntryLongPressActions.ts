import { getAttachmentById, getSortedNotebooks } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { useLongPress } from '@/mobile/hooks/useLongPress';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import type { LongPressMenuAction } from '@/mobile/overlay/longPressMenu/LongPressMenuController';
import { useLongPressMenu } from '@/mobile/overlay/longPressMenu/useLongPressMenu';
import { useNotebookPicker } from '@/mobile/overlay/notebookPicker/useNotebookPicker';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTextInputDialog } from '@/mobile/overlay/textInputDialog/useTextInputDialog';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IHostService } from '@/services/native/common/hostService';
import { Copy, Edit3, MoveRight, Trash2 } from 'lucide-react';
import { useRef } from 'react';

interface EntryEditTextOptions {
  title: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => void | Promise<void>;
}

interface EntryLongPressOptions {
  /** 文字内容,非空时菜单包含“复制”。 */
  text?: string;
  /** 是否启用长按,默认 true。 */
  enabled?: boolean;
  /** 文本类 entry 的编辑弹窗配置。 */
  editText?: EntryEditTextOptions;
  /** 插在“复制”和“删除”之间的额外动作(如语音识别)。 */
  extraActions?: LongPressMenuAction[];
}

/**
 * 日记 entry 的长按菜单交互:按配置提供复制、编辑、移动和删除等动作。
 * 聊天页与日历页共用,避免复制/删除逻辑多处重复。
 * 返回的 anchorRef 同时用作菜单定位锚点(图片可复用为预览 originRef)。
 */
export function useEntryLongPressActions<T extends HTMLElement>(
  entryId: string,
  { text, enabled = true, editText, extraActions }: EntryLongPressOptions = {},
) {
  const diaryService = useService(IDiaryService);
  const hostService = useService(IHostService);
  const showDialog = useDialog();
  const showSuccessToast = useSuccessToast();
  const showLongPressMenu = useLongPressMenu();
  const showNotebookPicker = useNotebookPicker();
  const showTextInputDialog = useTextInputDialog();
  const anchorRef = useRef<T>(null);
  const content = text ?? '';

  const copyText = async () => {
    if (!content) return;
    try {
      await hostService.writeToClipboard(content);
      showSuccessToast({ message: localize('common.copied', 'Copied') });
    } catch {
      showSuccessToast({ message: localize('common.copyFailed', 'Copy failed') });
    }
  };

  const confirmDeleteEntry = () => {
    showDialog({
      message: localize(
        'diary.deleteEntryConfirm',
        'Delete this entry? It will be removed from this notebook.',
      ),
      confirmLabel: localize('common.delete', 'Delete'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      tone: 'danger',
      onConfirm: () => {
        diaryService.softDeleteEntry(entryId);
        showSuccessToast({ message: localize('diary.entryDeleted', 'Deleted') });
      },
    });
  };

  const openEditDialog = () => {
    if (!editText) return;
    showTextInputDialog({
      title: editText.title,
      value: editText.value,
      placeholder: editText.placeholder ?? localize('diary.edit.placeholder', 'Enter text'),
      saveLabel: localize('common.save', 'Save'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      rootTestId: DiaryChat.editTextDialog,
      inputTestId: DiaryChat.editTextInput,
      saveTestId: DiaryChat.editTextSave,
      cancelTestId: DiaryChat.editTextCancel,
      onSave: editText.onSave,
    });
  };

  const openMoveNotebookPicker = () => {
    const model = diaryService.modelState;
    const entry = model.entryMap.get(entryId);
    if (!entry || entry.deletedAt) return;
    const targetNotebooks = getSortedNotebooks(model).filter(
      (notebook) => notebook.id !== entry.notebookId,
    );
    if (targetNotebooks.length === 0) return;

    showNotebookPicker({
      title: localize('diary.moveEntry.title', 'Move to notebook'),
      notebooks: targetNotebooks.map((notebook) => {
        const coverCandidate = notebook.avatarAttachmentId
          ? getAttachmentById(model, notebook.avatarAttachmentId)
          : undefined;
        return {
          id: notebook.id,
          name: notebook.name,
          coverAttachment: coverCandidate?.type === 'image' ? coverCandidate : undefined,
        };
      }),
      onSelect: (notebookId) => {
        diaryService.moveEntryToNotebook(entryId, notebookId);
        showSuccessToast({ message: localize('diary.entryMoved', 'Moved') });
      },
      rootTestId: DiaryChat.moveEntrySheet,
      searchTestId: DiaryChat.moveEntrySearch,
      listTestId: DiaryChat.moveEntryList,
      optionTestId: DiaryChat.moveEntryOption,
      closeTestId: DiaryChat.moveEntryCancel,
    });
  };

  const openMenu = () => {
    const root = anchorRef.current;
    if (!root) return;
    const actions: LongPressMenuAction[] = [];
    const model = diaryService.modelState;
    const entry = model.entryMap.get(entryId);
    const movable = entry
      ? getSortedNotebooks(model).some((notebook) => notebook.id !== entry.notebookId)
      : false;
    if (content) {
      actions.push({
        id: 'copy',
        label: localize('common.copy', 'Copy'),
        icon: Copy,
        run: copyText,
      });
    }
    if (editText) {
      actions.push({
        id: 'edit',
        label: localize('common.edit', 'Edit'),
        icon: Edit3,
        run: openEditDialog,
      });
    }
    if (extraActions) actions.push(...extraActions);
    if (movable) {
      actions.push({
        id: 'move',
        label: localize('diary.moveEntry.action', 'Move'),
        icon: MoveRight,
        run: openMoveNotebookPicker,
      });
    }
    actions.push({
      id: 'delete',
      label: localize('common.delete', 'Delete'),
      icon: Trash2,
      run: confirmDeleteEntry,
    });
    hostService.vibrateShort();
    showLongPressMenu({
      anchorRect: root.getBoundingClientRect(),
      actions,
    });
  };

  const { longPressEvents } = useLongPress<T>(openMenu, undefined, { enabled });

  return { anchorRef, longPressEvents };
}
