import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { TextInputDialogController, TextInputDialogOptions } from './TextInputDialogController';

export function useTextInputDialog() {
  const instantiationService = useService(IInstantiationService);
  return (options: TextInputDialogOptions) =>
    TextInputDialogController.create(options, instantiationService);
}
