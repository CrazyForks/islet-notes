import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { ImportSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

export function SettingsImportPage() {
  const navigationService = useService(INavigationService);

  return (
    <HeaderPage
      pageTestId={ImportSettings.page}
      contentTestId={ImportSettings.content}
      header={{ title: localize('settings.import.title', 'Import'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            label: localize('settings.import.minimalDiary', 'Minimal Diary'),
            testId: ImportSettings.minimalDiary,
            onClick: () => navigationService.navigate({ path: '/settings/import/minimal-diary' }),
          },
        ]}
      />
    </HeaderPage>
  );
}
