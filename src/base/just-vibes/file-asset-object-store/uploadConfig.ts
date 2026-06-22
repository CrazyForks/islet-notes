// @islet-import-scope same-dir

import type { S3ConfigRecord, SyncConfigRecord, WebDAVConfigRecord } from '@/core/diary/type';

export type UploadConfig = SyncConfigRecord;
export type EditableS3Config = Omit<S3ConfigRecord, 'updatedAt'>;
export type EditableWebDAVConfig = Omit<WebDAVConfigRecord, 'updatedAt'>;
export type EditableUploadConfig = EditableS3Config | EditableWebDAVConfig;

export function emptyS3Config(): EditableS3Config {
  return {
    provider: 's3',
    endpoint: '',
    region: '',
    bucket: '',
    accessKeyId: '',
    secretAccessKey: '',
    prefix: 'chat-diary',
    forcePathStyle: true,
  };
}

export function emptyWebDAVConfig(): EditableWebDAVConfig {
  return {
    provider: 'webdav',
    url: '',
    username: '',
    password: '',
    prefix: 'chat-diary',
  };
}

export function syncChannelDisplayName(provider: SyncConfigRecord['provider']): string {
  return provider === 'webdav' ? 'WebDAV' : 'S3';
}

export function isUploadConfigComplete(
  config: EditableUploadConfig | UploadConfig | undefined,
): boolean {
  if (!config) return false;
  if (config.provider === 'webdav') {
    return !!config.url.trim();
  }
  return !!(
    config.endpoint.trim() &&
    config.region.trim() &&
    config.bucket.trim() &&
    config.accessKeyId.trim() &&
    config.secretAccessKey.trim()
  );
}
