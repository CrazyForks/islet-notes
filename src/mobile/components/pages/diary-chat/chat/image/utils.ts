import type { CSSProperties } from 'react';

const FALLBACK_IMAGE_WIDTH = 4;
const FALLBACK_IMAGE_HEIGHT = 3;

export const MESSAGE_IMAGE_MAX_WIDTH = 180;
export const MESSAGE_IMAGE_MAX_HEIGHT = 180;
export const MESSAGE_IMAGE_VIEWPORT_WIDTH_RATIO = 0.64;
export const MESSAGE_IMAGE_MAX_HEIGHT_TO_WIDTH_RATIO = 3;

interface ImageRatio {
  width: number;
  height: number;
  value: number;
}

function getImageRatio(width: number | undefined, height: number | undefined): ImageRatio {
  if (!width || !height || width <= 0 || height <= 0) {
    return {
      width: FALLBACK_IMAGE_WIDTH,
      height: FALLBACK_IMAGE_HEIGHT,
      value: FALLBACK_IMAGE_WIDTH / FALLBACK_IMAGE_HEIGHT,
    };
  }
  return {
    width,
    height,
    value: width / height,
  };
}

export function getClampedImageRatio(
  width: number | undefined,
  height: number | undefined,
): ImageRatio {
  const ratio = getImageRatio(width, height);
  const minRatio = 1 / MESSAGE_IMAGE_MAX_HEIGHT_TO_WIDTH_RATIO;
  if (ratio.value >= minRatio) return ratio;
  return {
    width: 1,
    height: MESSAGE_IMAGE_MAX_HEIGHT_TO_WIDTH_RATIO,
    value: minRatio,
  };
}

export function getImageMessageStyle(
  width: number | undefined,
  height: number | undefined,
): CSSProperties {
  const ratio = getClampedImageRatio(width, height);
  return {
    ['--message-image-aspect-ratio' as string]: `${Math.round(ratio.value * 1000000) / 1000000}`,
    ['--message-image-fit-width' as string]: `${Math.round(MESSAGE_IMAGE_MAX_HEIGHT * ratio.value * 1000) / 1000}px`,
  };
}
