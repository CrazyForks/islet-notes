import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { CloudSync } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { CloudDownload, CloudUpload } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router';

type SetupMode = 'auto' | 'import';

export function StartupSetupPage() {
  const navigate = useNavigate();
  const selectMode = (mode: SetupMode) => {
    navigate('/startup/setup/sync', { state: { mode } });
  };

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.S3SettingsPage.SetupContent}
      pageTestId={CloudSync.page}
      contentTestId={CloudSync.setupContent}
      header={{ tone: 'surface', showBack: true }}
    >
      <FormPage title={localize('settings.sync.title', 'Cloud Sync')} testId={CloudSync.startCard}>
        <FormGroup
          title={localize('settings.sync.initMode', 'Sync setup')}
          items={[
            {
              type: 'navigation',
              icon: <CloudUpload size={26} strokeWidth={1.5} />,
              title: localize('settings.sync.mode.auto', 'Create new sync'),
              description: localize(
                'settings.sync.mode.autoDesc',
                'Generate a new recovery key and create an encrypted remote library.',
              ),
              testId: CloudSync.createMode,
              onClick: () => selectMode('auto'),
            },
            {
              type: 'navigation',
              icon: <CloudDownload size={26} strokeWidth={1.5} />,
              title: localize('settings.sync.mode.import', 'Connect existing sync'),
              description: localize(
                'settings.sync.mode.importDesc',
                'Use a previous recovery key to connect to an encrypted remote library.',
              ),
              testId: CloudSync.importMode,
              onClick: () => selectMode('import'),
            },
          ]}
        />
      </FormPage>
    </HeaderLayoutPage>
  );
}
