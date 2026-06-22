const BYTES_PER_MB = 1024 * 1024;

// 转码目标：720p H.264 MP4 + AAC，约 2.5Mbps 视频码率 + 96kbps 音频码率。
export const VIDEO_TARGET_HEIGHT = 720;
export const VIDEO_TARGET_VIDEO_BITRATE = 2_500_000;
export const VIDEO_TARGET_AUDIO_BITRATE = 96_000;

export function formatMediaSizeMb(sizeBytes: number | undefined): string {
  const safeSize =
    typeof sizeBytes === 'number' && Number.isFinite(sizeBytes) ? Math.max(0, sizeBytes) : 0;
  return `${(safeSize / BYTES_PER_MB).toFixed(1)}MB`;
}

export function formatAudioDuration(durationSeconds: number): string {
  const safeDuration = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0;
  return `${safeDuration.toFixed(1)}s`;
}

export function formatRecordingElapsedDuration(durationSeconds: number): string {
  const total = Number.isFinite(durationSeconds) ? Math.max(0, Math.floor(durationSeconds)) : 0;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 视频预览时长来自浏览器/原生读取的毫秒值，未知时返回空串以隐藏角标。
export function formatVideoPreviewDuration(durationMs: number | undefined): string {
  if (!durationMs || !Number.isFinite(durationMs) || durationMs <= 0) return '';
  const total = Math.round(durationMs / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatVideoDurationBadge(durationSeconds: number | undefined): string {
  const safeDuration =
    typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) ? durationSeconds : 0;
  const totalSeconds = Math.max(1, Math.round(safeDuration));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function estimateVideoUploadSize(options: {
  sourceSize: number;
  durationMs?: number;
  originalQuality: boolean;
}): number {
  // 仅「原画质」按原片体积展示；其余一律转码，按目标码率估算。
  if (options.originalQuality) {
    return options.sourceSize;
  }
  const durationSeconds = options.durationMs ? options.durationMs / 1000 : 0;
  if (durationSeconds <= 0) {
    return options.sourceSize;
  }
  return Math.ceil(
    ((VIDEO_TARGET_VIDEO_BITRATE + VIDEO_TARGET_AUDIO_BITRATE) * durationSeconds) / 8,
  );
}
