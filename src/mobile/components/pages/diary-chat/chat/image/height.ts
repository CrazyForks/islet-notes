import {
  MESSAGE_IMAGE_MAX_HEIGHT,
  MESSAGE_IMAGE_MAX_WIDTH,
  MESSAGE_IMAGE_VIEWPORT_WIDTH_RATIO,
  getClampedImageRatio,
} from './utils';

export const MESSAGE_IMAGE_ROW_EXTRA_HEIGHT = 10;

export function estimateImageMessageHeight(
  width: number | undefined,
  height: number | undefined,
  viewportWidth: number,
) {
  const ratio = getClampedImageRatio(width, height);
  const displayWidth = Math.min(
    viewportWidth * MESSAGE_IMAGE_VIEWPORT_WIDTH_RATIO,
    MESSAGE_IMAGE_MAX_WIDTH,
    MESSAGE_IMAGE_MAX_HEIGHT * ratio.value,
  );
  const displayHeight = displayWidth / ratio.value;
  return Math.ceil(displayHeight + MESSAGE_IMAGE_ROW_EXTRA_HEIGHT);
}
