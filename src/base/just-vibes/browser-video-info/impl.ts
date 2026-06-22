// @islet-import-scope same-dir

const VIDEO_THUMBNAIL_MIN_DIMENSION = 256;
const VIDEO_THUMBNAIL_QUALITY = 0.82;

export interface BrowserVideoInfo {
  width: number;
  height: number;
  duration: number;
  durationMs: number;
  thumbnail: Blob;
}

export async function readBrowserVideoInfo(url: string): Promise<BrowserVideoInfo> {
  if (typeof document === 'undefined') {
    return createFallbackBrowserVideoInfo();
  }

  try {
    return await readBrowserVideoInfoOrThrow(url);
  } catch {
    return createFallbackBrowserVideoInfo();
  }
}

async function readBrowserVideoInfoOrThrow(url: string): Promise<BrowserVideoInfo> {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await waitForVideoMetadata(video);
    await waitForVideoFrame(video).catch(() => undefined);
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    const durationMs = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0;
    return {
      width,
      height,
      duration: Math.round(durationMs / 1000),
      durationMs,
      thumbnail:
        width && height
          ? await captureVideoThumbnail(video, width, height).catch(() =>
              createFallbackVideoThumbnail(),
            )
          : await createFallbackVideoThumbnail(),
    };
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}

function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return waitForVideoEvent(video, 'loadedmetadata');
}

async function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return;
  const thumbnailTime = getThumbnailTime(video.duration);
  if (thumbnailTime > 0) {
    const seeked = waitForVideoEvent(video, 'seeked');
    video.currentTime = thumbnailTime;
    await seeked;
    return;
  }
  await waitForVideoEvent(video, 'loadeddata');
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for video ${eventName}.`));
    }, 5000);
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener(eventName, onReady);
      video.removeEventListener('error', onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video.'));
    };
    video.addEventListener(eventName, onReady, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

function getThumbnailTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0.1) return 0;
  return Math.min(0.1, Math.max(0, duration - 0.01));
}

async function captureVideoThumbnail(
  video: HTMLVideoElement,
  width: number,
  height: number,
): Promise<Blob> {
  const size = fitVideoThumbnailSize(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context is not available.');
  context.fillStyle = '#111111';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(video, 0, 0, size.width, size.height);
  return canvasToJpegBlob(canvas);
}

function fitVideoThumbnailSize(width: number, height: number): { width: number; height: number } {
  const minDimension = Math.min(width, height);
  const scale = minDimension > 0 ? Math.min(1, VIDEO_THUMBNAIL_MIN_DIMENSION / minDimension) : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function createFallbackBrowserVideoInfo(): Promise<BrowserVideoInfo> {
  return {
    width: 0,
    height: 0,
    duration: 0,
    durationMs: 0,
    thumbnail: await createFallbackVideoThumbnail(),
  };
}

async function createFallbackVideoThumbnail(): Promise<Blob> {
  if (typeof document === 'undefined') return new Blob([], { type: 'image/jpeg' });
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#111111';
    context.fillRect(0, 0, 1, 1);
  }
  return canvasToJpegBlob(canvas).catch(() => new Blob([], { type: 'image/jpeg' }));
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate thumbnail.'));
      },
      'image/jpeg',
      VIDEO_THUMBNAIL_QUALITY,
    );
  });
}
