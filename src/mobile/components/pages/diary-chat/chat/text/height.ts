import { layout, prepare } from '@chenglou/pretext';

const MESSAGE_VISIBLE_GAP = 10;
const TEXT_MESSAGE_MIN_HEIGHT = 40;
const TEXT_MESSAGE_VERTICAL_PADDING = 16;
const TEXT_FONT = '17px PingFang SC';
const TEXT_WHITE_SPACE = 'pre-wrap';

const textHeightCache = new Map<string, number>();

export function estimateTextMessageHeight(text: string | undefined, containerWidth: number) {
  const maxBubbleWidth = Math.min(containerWidth * 0.72, 340) - 24;
  const normalizedText = text ?? '';
  const cacheKey = `${maxBubbleWidth}:${TEXT_FONT}:${TEXT_WHITE_SPACE}:${normalizedText}`;
  const cached = textHeightCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const measured = layout(
    prepare(normalizedText, TEXT_FONT, { whiteSpace: TEXT_WHITE_SPACE }),
    maxBubbleWidth,
    24,
  );
  const bubbleHeight = Math.max(
    TEXT_MESSAGE_MIN_HEIGHT,
    measured.height + TEXT_MESSAGE_VERTICAL_PADDING,
  );
  const height = bubbleHeight + MESSAGE_VISIBLE_GAP;
  textHeightCache.set(cacheKey, height);
  return height;
}
