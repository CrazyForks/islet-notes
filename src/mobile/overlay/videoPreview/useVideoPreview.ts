import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { VideoPreviewController, VideoPreviewOptions } from './VideoPreviewController';

export function useVideoPreview() {
  const instantiationService = useService(IInstantiationService);
  return (options: VideoPreviewOptions) =>
    VideoPreviewController.create(options, instantiationService);
}
