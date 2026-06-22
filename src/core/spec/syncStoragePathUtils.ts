import type { SyncConfigRecord } from '@/core/diary/type';

export function normalizeUploadPrefix(prefix: string | undefined): string {
  return (prefix ?? '').trim().replace(/^\/+|\/+$/g, '');
}

export function normalizeUploadPathPrefix(prefix: string | undefined): string {
  const normalized = normalizeUploadPrefix(prefix);
  return normalized ? `${normalized}/` : '';
}

export function extractAttachmentStorageRef(key: string): string | undefined {
  const cleanKey = key.replace(/^\/+/, '');
  if (cleanKey.startsWith('attachments/')) return cleanKey;
  return undefined;
}

export function isAttachmentStorageRef(key: string): boolean {
  return !!extractAttachmentStorageRef(key);
}

export function attachmentShard(attachmentId: string): string {
  return attachmentId.slice(0, 2);
}

export function requireRecoveryKeyHash(config: Pick<SyncConfigRecord, 'recoveryKeyHash'>): string {
  const hash = config.recoveryKeyHash?.trim();
  if (!hash) throw new Error('Recovery key hash is required for upload.');
  return hash;
}
