import { localize } from '@/nls';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { TextInputRow } from '@/mobile/components/TextInputRow';
import { DiaryCreate } from '@/mobile/test.id';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';

export function DiariesNewPage() {
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const [name, setName] = useState('');
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const id = diaryService.addNotebook(name.trim());
    navigationService.navigate({ path: `/diary/${id}`, replace: true });
  };

  return (
    <HeaderPage
      pageTestId={DiaryCreate.page}
      contentTestId={DiaryCreate.content}
      header={{
        title: localize('diary.create', 'New notebook'),
        showBack: true,
        right: {
          type: 'button',
          label: localize('common.save', 'Save'),
          disabled: !canSave,
          testId: DiaryCreate.save,
          onClick: save,
        },
      }}
    >
      <TextInputRow
        id='notebookName'
        testId={DiaryCreate.nameInput}
        autoFocus
        placeholder={localize('diary.name', 'Notebook name')}
        value={name}
        onChange={setName}
      />
    </HeaderPage>
  );
}
