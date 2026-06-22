import React, { useCallback, useEffect, useRef } from 'react';

const DEFAULT_LONG_PRESS_MS = 450;
const DEFAULT_MOVE_TOLERANCE = 10;

interface UseLongPressOptions {
  enabled?: boolean;
  moveTolerance?: number;
}

export function useLongPress<T extends HTMLElement>(
  callback: () => void,
  delay = DEFAULT_LONG_PRESS_MS,
  { enabled = true, moveTolerance = DEFAULT_MOVE_TOLERANCE }: UseLongPressOptions = {},
) {
  const timer = useRef<number>();
  const startPoint = useRef<{ x: number; y: number }>();
  const isLongPress = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
    startPoint.current = undefined;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startLongPress = useCallback(
    (event: React.TouchEvent<T> | React.MouseEvent<T>) => {
      if (!enabled) return;
      event.stopPropagation();
      clearTimer();
      isLongPress.current = false;

      if ('touches' in event) {
        if (event.touches.length !== 1) return;
        startPoint.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else {
        startPoint.current = { x: event.clientX, y: event.clientY };
      }

      timer.current = window.setTimeout(() => {
        clearTimer();
        isLongPress.current = true;
        callback();
      }, delay);
    },
    [callback, clearTimer, delay, enabled],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<T>) => {
      const point = startPoint.current;
      const touch = event.touches[0];
      if (!point || !touch || !timer.current) return;
      const dx = touch.clientX - point.x;
      const dy = touch.clientY - point.y;
      if (dx * dx + dy * dy > moveTolerance * moveTolerance) {
        clearTimer();
      }
    },
    [clearTimer, moveTolerance],
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<T>) => {
      event.preventDefault();
      event.stopPropagation();
      clearTimer();
      if (enabled && !isLongPress.current) {
        isLongPress.current = true;
        callback();
      }
    },
    [callback, clearTimer, enabled],
  );

  const handleClickCapture = useCallback((event: React.MouseEvent<T>) => {
    if (!isLongPress.current) return;
    isLongPress.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    isLongPress,
    longPressEvents: {
      onClickCapture: handleClickCapture,
      onTouchCancel: clearTimer,
      onTouchEnd: clearTimer,
      onTouchMove: handleTouchMove,
      onTouchStart: startLongPress,
      onMouseDown: startLongPress,
      onMouseUp: clearTimer,
      onContextMenu: handleContextMenu,
    },
  };
}
