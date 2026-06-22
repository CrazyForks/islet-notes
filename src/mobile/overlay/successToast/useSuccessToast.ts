import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { SuccessToastController, SuccessToastOptions } from './SuccessToastController';

export function useSuccessToast() {
  const instantiationService = useService(IInstantiationService);
  return (options: SuccessToastOptions) =>
    SuccessToastController.create(options, instantiationService);
}
