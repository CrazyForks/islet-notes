// 媒体体积与时长展示模块。
// 统一音频/视频时长、文件体积展示，以及视频上传体积估算和转码目标参数。
export {
  VIDEO_TARGET_AUDIO_BITRATE,
  VIDEO_TARGET_HEIGHT,
  VIDEO_TARGET_VIDEO_BITRATE,
  estimateVideoUploadSize,
  formatAudioDuration,
  formatMediaSizeMb,
  formatRecordingElapsedDuration,
  formatVideoDurationBadge,
  formatVideoPreviewDuration,
} from './impl';
