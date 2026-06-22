import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { ActionSheetController, ActionSheetOptions } from './ActionSheetController';

export function useActionSheet() {
  const instantiationService = useService(IInstantiationService);
  return (options: ActionSheetOptions) =>
    ActionSheetController.create(options, instantiationService);
}
