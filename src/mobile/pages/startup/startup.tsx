import { FeatureCard } from '@/mobile/components/FeatureCard';
import { PageHeader } from '@/mobile/components/PageHeader';
import { CloudSync, Startup } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { useService } from '@/hooks/use-service';
import { CloudDownload, CloudUpload } from 'lucide-react';
import React from 'react';

export function StartupPage() {
  const navigationService = useService(INavigationService);
  return (
    <div
      className={cx(styles.Page.GroupedRoot, styles.StartupPage.RootColumn)}
      data-test-id={Startup.page}
    >
      <PageHeader title={localize('startup.title', 'Choose startup mode')} />
      <main className={styles.StartupPage.Content} data-test-id={Startup.content}>
        <div className={styles.StartupPage.Cards}>
          <FeatureCard
            icon={<CloudUpload size={26} strokeWidth={1.5} />}
            title={localize('settings.sync.mode.auto', 'Create new sync')}
            description={localize(
              'settings.sync.mode.autoDesc',
              'Generate a new recovery key and create an encrypted remote library.',
            )}
            testId={CloudSync.createMode}
            onClick={() =>
              navigationService.navigate({
                path: '/startup/setup/sync',
                state: { mode: 'auto' },
              })
            }
          />
          <FeatureCard
            icon={<CloudDownload size={26} strokeWidth={1.5} />}
            title={localize('settings.sync.mode.import', 'Connect existing sync')}
            description={localize(
              'settings.sync.mode.importDesc',
              'Use a previous recovery key to connect to an encrypted remote library.',
            )}
            testId={CloudSync.importMode}
            onClick={() =>
              navigationService.navigate({
                path: '/startup/setup/sync',
                state: { mode: 'import' },
              })
            }
          />
        </div>
        <div className={styles.StartupPage.Footer}>
          <button
            className={styles.Link.Footer}
            type='button'
            data-test-id={Startup.experienceMode}
            onClick={() =>
              navigationService.navigate({
                path: '/startup/experience',
                replace: true,
              })
            }
          >
            {localize('startup.experience.title', 'Experience mode')}
          </button>
        </div>
      </main>
    </div>
  );
}
