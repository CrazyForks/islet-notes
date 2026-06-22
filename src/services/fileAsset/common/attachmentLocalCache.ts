import { ensureBlobType, mimeFromKey } from '@/base/just-vibes/media-mime';
import type { IHostService } from '@/services/native/common/hostService';

export class AttachmentLocalCache {
  constructor(
    private readonly hostService: IHostService,
    private readonly getScope: () => string,
  ) {}

  async write(key: string, blob: Blob): Promise<void> {
    const mimeType = requireMimeFromKey(key);
    await this.hostService.writeAttachmentFile({
      scope: this.getScope(),
      key,
      blob: ensureBlobType(blob, mimeType),
    });
  }

  async read(key: string): Promise<Blob | undefined> {
    const mimeType = mimeFromKey(key);
    if (!mimeType) return undefined;
    const blob = await this.hostService.readAttachmentFile({
      scope: this.getScope(),
      key,
    });
    return blob ? ensureBlobType(blob, mimeType) : undefined;
  }
}

export function requireMimeFromKey(key: string): string {
  const mimeType = mimeFromKey(key);
  if (!mimeType) throw new Error(`Unsupported attachment key extension: ${key}`);
  return mimeType;
}
