import { getSortedNotebooks } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { useForm } from '@/mobile/hooks/useForm';
import { MinimalDiaryImport } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useMemo, useState } from 'react';

const MAX_IMPORT_FILE_SIZE = 500 * 1024 * 1024;
const MINIMAL_DIARY_ACCEPT = '*/*';
const MINIMAL_DIARY_SUPPORTED_EXTENSIONS = ['.mdd', '.zip'];

type MinimalDiaryImportForm = {
  file: File | undefined;
  notebookId: string;
};

export function SettingsImportMinimalDiaryPage() {
  const navigationService = useService(INavigationService);
  const model = useDiaryModel();
  const notebooks = useMemo(() => getSortedNotebooks(model), [model]);
  const [running, setRunning] = useState(false);
  const importForm = useForm<MinimalDiaryImportForm>({
    initialValues: {
      notebookId: notebooks[0]?.id ?? '',
    },
    fields: [
      {
        name: 'file',
        label: 'Zip',
        type: 'file',
        accept: MINIMAL_DIARY_ACCEPT,
        maxSize: MAX_IMPORT_FILE_SIZE,
        maxSizeMessage: () =>
          localize(
            'settings.import.fileTooLarge',
            'Files must be {0} MB or smaller.',
            MAX_IMPORT_FILE_SIZE / (1024 * 1024),
          ),
        validate: (value) => {
          if (!isFileValue(value)) return undefined;
          if (isSupportedMinimalDiaryFile(value)) return undefined;
          return localize(
            'settings.import.minimalDiary.unsupportedFile',
            'Only .mdd and .zip files are supported.',
          );
        },
        testId: MinimalDiaryImport.file,
        inputTestId: MinimalDiaryImport.fileInput,
        disabled: running,
      },
      {
        name: 'notebookId',
        label: localize('settings.import.targetNotebook', 'Target notebook'),
        type: 'option',
        testId: MinimalDiaryImport.existingNotebook,
        disabled: running,
        options: notebooks.map((notebook) => ({
          label: notebook.name,
          value: notebook.id,
        })),
      },
    ],
  });

  const file = importForm.values.file;
  const canStart = !!file && !running;
  const fileField = importForm.fields[0];
  const notebookField = importForm.fields[1];

  const startImport = async () => {
    if (running || !importForm.verify()) return;
    const file = importForm.values.file;
    if (!file) return;
    const notebookId = importForm.values.notebookId;
    setRunning(true);
    navigationService.navigate({
      path: '/settings/import/minimal-diary/result',
      replace: true,
      state: {
        file,
        notebookId,
      },
    });
  };

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.WeuiForm.PageMain}
      pageTestId={MinimalDiaryImport.page}
      contentTestId={MinimalDiaryImport.content}
      header={{ showBack: true, tone: 'surface' }}
    >
      <FormPage
        title={localize('settings.import.minimalDiary.title', 'Import Minimal Diary')}
        actions={[
          {
            label: running
              ? localize('settings.import.importing', 'Importing')
              : localize('settings.import.start', 'Import'),
            disabled: !canStart,
            testId: MinimalDiaryImport.start,
            onClick: () => void startImport(),
          },
        ]}
      >
        <FormGroup title={localize('settings.import.file', 'File')} items={[fileField]} />
        <FormGroup
          title={localize('settings.import.targetNotebook', 'Target notebook')}
          items={[notebookField]}
        />
      </FormPage>
    </HeaderLayoutPage>
  );
}

function isFileValue(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function isSupportedMinimalDiaryFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return MINIMAL_DIARY_SUPPORTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}
