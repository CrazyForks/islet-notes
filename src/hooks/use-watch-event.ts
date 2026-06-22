import { useLayoutEffect } from 'react';
import { Event } from 'vscf/base/common/event';
import { useRender } from './use-render';

export function useWatchEvent<T = unknown>(
  event: Event<T> | undefined,
  shouldRender?: (event: T) => boolean,
) {
  const render = useRender();
  useLayoutEffect(() => {
    if (!event) return;
    return event((eventValue) => {
      if (!shouldRender || shouldRender(eventValue)) {
        render();
      }
    }).dispose;
  }, [event, render, shouldRender]);
}
