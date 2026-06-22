import { useService } from '@/hooks/use-service';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { useEffect } from 'react';

export function useBackButton(callback: (() => void) | undefined): void {
  const navigationService = useService(INavigationService);

  useEffect(() => {
    if (!callback) return;
    const listener = navigationService.listenBackButton(callback);
    return () => {
      listener.dispose();
    };
  }, [callback, navigationService]);
}
