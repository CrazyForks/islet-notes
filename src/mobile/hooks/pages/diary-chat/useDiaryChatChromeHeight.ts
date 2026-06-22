import { RefObject, useLayoutEffect, useState } from 'react';

interface UseDiaryChatChromeHeightOptions {
  headerRef: RefObject<HTMLElement | null>;
  footerRef: RefObject<HTMLElement | null>;
}

export function useDiaryChatChromeHeight({
  headerRef,
  footerRef,
}: UseDiaryChatChromeHeightOptions) {
  const [chromeHeight, setChromeHeight] = useState(() => estimateDiaryChatChromeHeight());

  useLayoutEffect(() => {
    const header = headerRef.current;
    const footer = footerRef.current;
    if (!header || !footer) return;

    const updateChromeHeight = () => {
      const nextHeight =
        header.getBoundingClientRect().height + footer.getBoundingClientRect().height;
      setChromeHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) < 1 ? currentHeight : nextHeight,
      );
    };

    updateChromeHeight();
    const resizeObserver = new ResizeObserver(updateChromeHeight);
    resizeObserver.observe(header);
    resizeObserver.observe(footer);
    window.visualViewport?.addEventListener('resize', updateChromeHeight);
    window.addEventListener('resize', updateChromeHeight);
    return () => {
      resizeObserver.disconnect();
      window.visualViewport?.removeEventListener('resize', updateChromeHeight);
      window.removeEventListener('resize', updateChromeHeight);
    };
  }, [footerRef, headerRef]);

  return chromeHeight;
}

const PAGE_HEADER_BASE_HEIGHT = 44;
const DIARY_CHAT_FOOTER_BASE_HEIGHT = 58;

function estimateDiaryChatChromeHeight(): number {
  return (
    PAGE_HEADER_BASE_HEIGHT +
    DIARY_CHAT_FOOTER_BASE_HEIGHT +
    readSafeAreaTop() +
    readSafeAreaBottom()
  );
}

function readSafeAreaTop(): number {
  return readCssPixelVariable('--sat');
}

function readSafeAreaBottom(): number {
  return readCssPixelVariable('--sab');
}

function readCssPixelVariable(name: string): number {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText = [
    'position:fixed',
    'visibility:hidden',
    'pointer-events:none',
    'inset:auto',
    `height:var(${name})`,
  ].join(';');
  document.documentElement.appendChild(probe);
  const value = window.getComputedStyle(probe).height;
  probe.remove();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
