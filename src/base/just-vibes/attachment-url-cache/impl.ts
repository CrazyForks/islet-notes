import { LRUCache } from 'lru-cache';
import { ensureBlobType, mimeFromKey } from '@/base/just-vibes/media-mime';

export type AttachmentUrlCacheRole = 'avatar' | 'thumbnail' | 'large';

export interface AttachmentUrlCache {
  acquire(options: AttachmentUrlCacheAcquireOptions): string;
  clear(): void;
}

interface AttachmentUrlCacheAcquireOptions {
  scope: string;
  key: string;
  blob: Blob;
  role: AttachmentUrlCacheRole;
}

const ROLE_LIMITS: Record<AttachmentUrlCacheRole, number> = {
  avatar: 100,
  thumbnail: 100,
  large: 5,
};

export function createAttachmentUrlCache(): AttachmentUrlCache {
  return new LruAttachmentUrlCache();
}

class LruAttachmentUrlCache implements AttachmentUrlCache {
  private readonly caches = new Map<AttachmentUrlCacheRole, LRUCache<string, string>>();

  acquire(options: AttachmentUrlCacheAcquireOptions): string {
    const cache = this.getCache(options.role);
    const id = buildUrlCacheId(options);
    const existing = cache.get(id);
    if (existing) return existing;
    const url = URL.createObjectURL(ensureBlobType(options.blob, mimeFromKey(options.key)));
    cache.set(id, url);
    return url;
  }

  clear(): void {
    for (const cache of this.caches.values()) cache.clear();
  }

  private getCache(role: AttachmentUrlCacheRole): LRUCache<string, string> {
    const existing = this.caches.get(role);
    if (existing) return existing;
    const cache = new LRUCache<string, string>({
      max: ROLE_LIMITS[role],
      dispose: (url) => URL.revokeObjectURL(url),
    });
    this.caches.set(role, cache);
    return cache;
  }
}

function buildUrlCacheId(options: { scope: string; key: string }): string {
  return `${options.scope}\n${options.key}`;
}
