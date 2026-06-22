import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { LongPressMenuController, LongPressMenuOptions } from './LongPressMenuController';

export function useLongPressMenu() {
  const instantiationService = useService(IInstantiationService);
  return (options: LongPressMenuOptions) =>
    LongPressMenuController.create(options, instantiationService);
}
