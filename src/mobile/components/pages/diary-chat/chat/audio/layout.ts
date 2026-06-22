export function getAudioBubbleWidth(duration: number): number {
  return Math.round(Math.min(240, 88 + (Math.max(0, duration) / 59) * 152));
}
