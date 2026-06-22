import { normalizeAndCheckMime } from '@/base/just-vibes/media-mime';
import { localize } from '@/nls';
import type { IHostService } from '@/services/native/common/hostService';

export const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
export const THUMBNAIL_MIN_DIMENSION = 256;
export const THUMBNAIL_QUALITY = 0.8;

// 文件入口校验：MIME 不支持或体积超限时抛出本地化错误。
export function assertSupportedImage(file: Blob) {
  try {
    normalizeAndCheckMime('image', file.type);
  } catch {
    throw new Error(
      localize('attachment.image.unsupported', 'JPEG, PNG, and WebP images are supported.'),
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(localize('attachment.image.tooLarge', 'Images must be 50 MB or smaller.'));
  }
}

/** Messages the Capacitor Camera plugin throws when the user dismisses the picker/camera. */
export function isPickCancellation(message: string): boolean {
  return /cancel|no image (picked|selected)/i.test(message);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return `data:${blob.type};base64,${await blobToBase64(blob)}`;
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytesToArrayBuffer(bytes)], { type: mimeType });
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export async function generateImageThumbnail(
  blob: Blob,
  hostService?: IHostService,
): Promise<Blob> {
  const nativeThumbnail = await tryGenerateNativeImageThumbnail(blob, hostService);
  if (nativeThumbnail) return nativeThumbnail;

  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, THUMBNAIL_MIN_DIMENSION / Math.min(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : (() => {
            const element = document.createElement('canvas');
            element.width = width;
            element.height = height;
            return element;
          })();
    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) throw new Error('Canvas context is not available.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob({ type: 'image/jpeg', quality: THUMBNAIL_QUALITY });
    }
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('Failed to generate thumbnail.'));
        },
        'image/jpeg',
        THUMBNAIL_QUALITY,
      );
    });
  } finally {
    bitmap.close();
  }
}

async function tryGenerateNativeImageThumbnail(
  blob: Blob,
  hostService: IHostService | undefined,
): Promise<Blob | undefined> {
  if (!hostService) return undefined;
  try {
    const imageBase64 = await blobToBase64(blob);
    if (hostService.caniuse('generateThumbnail')) {
      const result = await hostService.generateThumbnail({
        imageBase64,
        minDimension: THUMBNAIL_MIN_DIMENSION,
        quality: THUMBNAIL_QUALITY,
      });
      return base64ToBlob(result.imageBase64, result.mimeType || 'image/jpeg');
    }
  } catch {
    return undefined;
  }
}

export function inferMimeFromKey(key: string): string {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}
