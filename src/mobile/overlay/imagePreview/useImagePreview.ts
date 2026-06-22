import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { ImagePreviewController, ImagePreviewOptions } from './ImagePreviewController';

export function useImagePreview() {
  const instantiationService = useService(IInstantiationService);
  return (options: ImagePreviewOptions) =>
    ImagePreviewController.create(options, instantiationService);
}
