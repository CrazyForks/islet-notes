import { estimateImageMessageHeight } from '../image/main';

export function estimateVideoMessageHeight(
  width: number | undefined,
  height: number | undefined,
  viewportWidth: number,
) {
  // 视频气泡复用图片缩略图的布局，高度估算一致。
  return estimateImageMessageHeight(width, height, viewportWidth);
}
