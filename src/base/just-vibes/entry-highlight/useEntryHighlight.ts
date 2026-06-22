import { useCallback, useEffect, useRef, useState } from 'react';

// 高亮整体时长(亮起 + 停留 + 淡出),需不小于调用方 CSS 动画时长,
// 这样动画播完后才清除状态,覆盖层随之卸载,保证下次还能重新触发。
export const ENTRY_HIGHLIGHT_DURATION_MS = 2000;

export function useEntryHighlight(durationMs: number = ENTRY_HIGHLIGHT_DURATION_MS) {
  const [highlightedEntryId, setHighlightedEntryId] = useState<string>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>();

  const triggerHighlight = useCallback(
    (entryId: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // 先清空再点亮,即使对同一条目重复触发,也能让覆盖层重新挂载并从头播放动画。
      setHighlightedEntryId(undefined);
      rafRef.current = requestAnimationFrame(() => {
        setHighlightedEntryId(entryId);
        timerRef.current = setTimeout(() => setHighlightedEntryId(undefined), durationMs);
      });
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { highlightedEntryId, triggerHighlight };
}
