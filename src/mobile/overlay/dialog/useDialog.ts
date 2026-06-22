import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { DialogController, DialogOptions } from './DialogController';

export function useDialog() {
  const instantiationService = useService(IInstantiationService);
  return (options: DialogOptions) => DialogController.create(options, instantiationService);
}
