import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { VideoPlayerController, VideoPlayerOptions } from './VideoPlayerController';

export function useVideoPlayer() {
  const instantiationService = useService(IInstantiationService);
  return (options: VideoPlayerOptions) =>
    VideoPlayerController.create(options, instantiationService);
}
