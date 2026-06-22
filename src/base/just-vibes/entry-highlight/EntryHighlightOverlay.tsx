import React from 'react';
import { EntryHighlight } from './ui';

export function EntryHighlightOverlay({
  active,
  className = EntryHighlight.Overlay,
  tail,
  tailClassName = EntryHighlight.OverlayTail,
}: {
  active: boolean;
  className?: string;
  tail?: boolean;
  tailClassName?: string;
}) {
  if (!active) return null;

  const overlayClassName =
    tail && tailClassName ? [className, tailClassName].filter(Boolean).join(' ') : className;
  return <span aria-hidden='true' className={overlayClassName} />;
}
