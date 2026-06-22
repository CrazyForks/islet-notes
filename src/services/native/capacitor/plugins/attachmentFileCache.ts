import { registerPlugin } from '@capacitor/core';

export interface NativeAttachmentFileCacheOptions {
  scope: string;
  key: string;
}

export interface NativeAttachmentFileCacheWriteOptions extends NativeAttachmentFileCacheOptions {
  data: string;
}

export interface NativeAttachmentFileCacheUrlResult {
  path?: string;
  missing?: boolean;
}

interface NativeAttachmentFileCachePlugin {
  ensureCachedFile(
    options: NativeAttachmentFileCacheOptions,
  ): Promise<NativeAttachmentFileCacheUrlResult>;
  writeFile(
    options: NativeAttachmentFileCacheWriteOptions,
  ): Promise<NativeAttachmentFileCacheUrlResult>;
}

export const NativeAttachmentFileCache =
  registerPlugin<NativeAttachmentFileCachePlugin>('AttachmentFileCache');
