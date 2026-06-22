import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { NotebookPickerController, NotebookPickerOptions } from './NotebookPickerController';

export function useNotebookPicker() {
  const instantiationService = useService(IInstantiationService);
  return (options: NotebookPickerOptions) =>
    NotebookPickerController.create(options, instantiationService);
}
