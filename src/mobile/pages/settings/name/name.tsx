import { localize } from '@/nls';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { TextInputRow } from '@/mobile/components/TextInputRow';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { ProfileName } from '@/mobile/test.id';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';

export function SettingsNamePage() {
  const navigationService = useService(INavigationService);
  const diaryService = useService(IDiaryService);
  const model = useDiaryModel();
  const [name, setName] = useState(model.profile.name ?? '');
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  const save = async () => {
    diaryService.updateProfileName(trimmedName);
    navigationService.goBack({ fallbackPath: '/settings/profile' });
  };

  return (
    <HeaderPage
      pageTestId={ProfileName.page}
      contentTestId={ProfileName.content}
      header={{
        title: localize('profile.name', 'Name'),
        showBack: true,
        right: {
          type: 'button',
          label: localize('common.save', 'Save'),
          disabled: !canSave,
          testId: ProfileName.save,
          onClick: () => void save(),
        },
      }}
    >
      <TextInputRow
        id='profileName'
        testId={ProfileName.nameInput}
        autoFocus
        placeholder={localize('profile.namePlaceholder', 'Enter a name')}
        value={name}
        onChange={setName}
      />
    </HeaderPage>
  );
}
