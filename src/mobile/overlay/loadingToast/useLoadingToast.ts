import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { LoadingToastController, LoadingToastOptions } from './LoadingToastController';

export function useLoadingToast() {
  const instantiationService = useService(IInstantiationService);
  return (options: LoadingToastOptions = {}) =>
    LoadingToastController.create(options, instantiationService);
}
