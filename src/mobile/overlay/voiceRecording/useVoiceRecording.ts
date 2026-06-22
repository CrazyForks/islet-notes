import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { VoiceRecordingController, VoiceRecordingOptions } from './VoiceRecordingController';

export function useVoiceRecording() {
  const instantiationService = useService(IInstantiationService);
  return (options: VoiceRecordingOptions) =>
    VoiceRecordingController.create(options, instantiationService);
}
