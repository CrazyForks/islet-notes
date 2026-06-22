import {
  getResolvedTheme,
  setResolvedTheme,
  themePreferenceChangeEvent,
} from '@/base/browser/initializeTheme';
import { useService } from '@/hooks/use-service';
import { IHostService } from '@/services/native/common/hostService';
import { useEffect } from 'react';

export function useNativeSystemBarIconStyle() {
  const hostService = useService(IHostService);

  useEffect(() => {
    const sync = () => {
      const theme = getResolvedTheme();
      setResolvedTheme(theme);
      void hostService.setBarStyle(theme);
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    sync();
    mediaQuery.addEventListener('change', sync);
    window.addEventListener(themePreferenceChangeEvent, sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
      window.removeEventListener(themePreferenceChangeEvent, sync);
    };
  }, [hostService]);
}
