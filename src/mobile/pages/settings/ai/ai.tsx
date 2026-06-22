import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { AISettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import {
  SPEECH_RECOGNITION_CONFIG_KEY,
  SPEECH_RECOGNITION_CONFIG_SWR_KEY,
  SpeechRecognitionConfigSchema,
} from '@/services/speechRecognition/common/speechRecognitionConfig';
import React from 'react';
import useSWR from 'swr';

export function SettingsAIPage() {
  const navigationService = useService(INavigationService);
  const hostService = useService(IHostService);
  const { data: speechRecognitionConfig } = useSWR(SPEECH_RECOGNITION_CONFIG_SWR_KEY, async () =>
    hostService.getPreference(SPEECH_RECOGNITION_CONFIG_KEY, SpeechRecognitionConfigSchema),
  );
  const speechRecognitionConfigured = !!speechRecognitionConfig;

  return (
    <HeaderPage
      pageTestId={AISettings.page}
      contentTestId={AISettings.content}
      header={{ title: localize('settings.ai', 'AI'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            label: localize('settings.speechRecognition.short', 'Voice to text'),
            right: {
              type: 'value',
              text: speechRecognitionConfigured
                ? localize('settings.configured', 'Configured')
                : localize('settings.notConfigured', 'Not configured'),
            },
            testId: AISettings.speechRecognition,
            onClick: () => navigationService.navigate({ path: '/settings/speech-recognition' }),
          },
        ]}
      />
    </HeaderPage>
  );
}
