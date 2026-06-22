import { getAttachmentById } from '@/core/diary/selectors';
import type {
  AudioAttachmentRecord,
  DiaryEntryRecord,
  DiaryModelData,
  ImageAttachmentRecord,
  VideoAttachmentRecord,
} from '@/core/diary/type';
import type { ChatItem } from '@/core/state/chatItems';
import type { AttachmentUploadTaskRecord } from '@/services/fileAsset/common/uploadTaskStore';

export type DiaryChatItem = ChatItem<AttachmentUploadTaskRecord>;

export type ResolvedChatItem =
  | { type: 'divider'; timestamp: number }
  | { type: 'text'; entry: DiaryEntryRecord; text: string | undefined }
  | { type: 'image'; entry: DiaryEntryRecord; attachment: ImageAttachmentRecord }
  | { type: 'audio'; entry: DiaryEntryRecord; attachment: AudioAttachmentRecord }
  | { type: 'video'; entry: DiaryEntryRecord; attachment: VideoAttachmentRecord }
  | { type: 'upload'; task: AttachmentUploadTaskRecord }
  | { type: 'unknown'; kind: 'entry' | 'attachment' };

export function resolveChatItem(item: DiaryChatItem, model: DiaryModelData): ResolvedChatItem {
  if (item.kind === 'divider') return { type: 'divider', timestamp: item.timestamp };
  if (item.kind === 'upload') return { type: 'upload', task: item.task };
  const entry = item.entry;
  if (entry.type === 'text') return { type: 'text', entry, text: entry.text };
  if (entry.type !== 'attachment') return { type: 'unknown', kind: 'entry' };
  const attachment = entry.attachmentId ? getAttachmentById(model, entry.attachmentId) : undefined;
  if (attachment?.type === 'image') return { type: 'image', entry, attachment };
  if (attachment?.type === 'audio') return { type: 'audio', entry, attachment };
  if (attachment?.type === 'video') return { type: 'video', entry, attachment };
  return { type: 'unknown', kind: 'attachment' };
}
