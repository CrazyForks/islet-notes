import { registerPlugin } from '@capacitor/core';

export interface NativeVideoCreateRecordOptions {
  /** 系统相册/相机返回的视频 URI。 */
  inputUri: string;
  /** 当前本地数据 scope，用于隔离原生临时视频源目录。 */
  cacheScope?: string;
}

export interface NativeVideoRecordResult {
  /** app 私有目录里的原视频副本路径。 */
  sourcePath: string;
  width: number;
  height: number;
  durationMs: number;
  size: number;
  /** 首帧 JPEG 缩略图，base64 编码。 */
  thumbnailBase64: string;
}

export interface NativeVideoPrepareUploadOptions {
  /** app 私有目录里的原视频副本路径。 */
  sourcePath: string;
  /** 原画质：跳过重编码，仅拷贝原片并提取元数据/缩略图。 */
  originalQuality: boolean;
  /** 目标高度（保持宽高比缩放）。 */
  targetHeight: number;
  /** 目标视频码率，单位 bps。 */
  videoBitrate: number;
  /** 附件缓存 key；提供后转码产物直接写入通用附件缓存。 */
  cacheKey?: string;
  /** 附件缓存 scope。 */
  cacheScope?: string;
}

export interface NativeVideoPrepareUploadResult {
  /** 本次上传产物的绝对文件路径，由 JS 读取后立即清理。 */
  outputPath: string;
  width: number;
  height: number;
  durationMs: number;
  size: number;
  /** 首帧 JPEG 缩略图，base64 编码。 */
  thumbnailBase64: string;
}

interface NativeVideoToolsPlugin {
  createRecord(options: NativeVideoCreateRecordOptions): Promise<NativeVideoRecordResult>;
  prepareUpload(options: NativeVideoPrepareUploadOptions): Promise<NativeVideoPrepareUploadResult>;
  cleanRecord(options: { path: string }): Promise<void>;
}

export const NativeVideoTools = registerPlugin<NativeVideoToolsPlugin>('VideoTools');
