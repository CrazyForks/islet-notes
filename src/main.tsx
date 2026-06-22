import '@/locales/browser/config';
import { localize } from '@/nls';

async function main() {
  const { startMobile } = await import('@/mobile/main');
  await startMobile();
}

void main().catch((error) => {
  console.error('Failed to start the app:', error);
  renderStartupError(error);
});

// Rendered without React or the app stylesheet: when startup fails this early,
// neither is guaranteed to have loaded.
function renderStartupError(error: unknown): void {
  const root = document.getElementById('root');
  if (!root) return;

  const container = document.createElement('div');
  container.style.cssText =
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'min-height:100vh;padding:32px;gap:12px;text-align:center;background:#ededed;' +
    'font-family:system-ui,-apple-system,sans-serif;color:#1f2329;';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:17px;font-weight:600;';
  title.textContent = localize('startup.error.title', 'Could not start Islet');

  const detail = document.createElement('div');
  detail.style.cssText = 'font-size:13px;color:#6b7280;max-width:480px;word-break:break-all;';
  detail.textContent = error instanceof Error ? error.message : String(error);

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.style.cssText =
    'margin-top:8px;padding:10px 24px;border:none;border-radius:8px;' +
    'background:#07c160;color:#fff;font-size:15px;';
  retry.textContent = localize('startup.error.retry', 'Retry');
  retry.addEventListener('click', () => window.location.reload());

  container.append(title, detail, retry);
  root.replaceChildren(container);
}
