import { initializeTheme } from '@/base/browser/initializeTheme';
import { GlobalContext } from '@/base/browser/GlobalContext';
import { installE2eDriverGlobal } from '@/services/e2e/common/e2eDriverService';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initServices } from './initServices';

export async function startMobile() {
  await import('react-photo-view/dist/react-photo-view.css');
  await import('xgplayer/dist/index.min.css');
  await import('./styles/main.css');
  initializeTheme();

  const services = await initServices();
  installE2eDriverGlobal(services.e2eDriverService);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GlobalContext.Provider value={{ instantiationService: services.instantiationService }}>
        <App />
      </GlobalContext.Provider>
    </StrictMode>,
  );
}
