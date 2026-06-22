import {
  importPackage,
  parseMinimalDiaryImportPackage,
  type ImportProgress,
} from '@/helper/parser/main';
import { useService } from '@/hooks/use-service';
import { ProgressBar } from '@/mobile/components/base/ProgressBar';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { styles } from '@/mobile/styles/ui';
import { MinimalDiaryImport } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router';

interface MinimalDiaryImportResultState {
  file?: File;
  notebookId?: string;
}

const initialImportProgress: ImportProgress = {
  completed: 0,
  total: 0,
  textImported: 0,
  textSkipped: 0,
  assetImported: 0,
  assetSkipped: 0,
};

export function SettingsImportMinimalDiaryResultPage() {
  const diaryService = useService(IDiaryService);
  const fileAssetService = useService(IFileAssetService);
  const navigationService = useService(INavigationService);
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const location = useLocation();
  const state = location.state as MinimalDiaryImportResultState | null;
  const file = state?.file;
  const notebookId = state?.notebookId;
  const [importProgress, setImportProgress] = useState<ImportProgress>(initialImportProgress);
  const [done, setDone] = useState(false);
  const [parsing, setParsing] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!file || !notebookId) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      diaryService.setIgnoreDatabaseSync(true);
      try {
        setDone(false);
        setParsing(true);
        const source = await parseMinimalDiaryImportPackage(file);
        setParsing(false);
        const importResult = await importPackage(source, {
          notebookId,
          diaryService,
          fileAssetService,
          onProgress: setImportProgress,
        });
        setImportProgress(importResult);
        setDone(true);
        showSuccessToast({
          message: localize('settings.import.result.success', 'Import complete'),
          testId: MinimalDiaryImport.successToast,
        });
      } catch (event) {
        setParsing(false);
        showTopTips({
          message: event instanceof Error ? event.message : String(event),
          testId: MinimalDiaryImport.error,
        });
      } finally {
        diaryService.setIgnoreDatabaseSync(false);
      }
    };

    void run();
  }, [diaryService, file, fileAssetService, notebookId, showSuccessToast, showTopTips]);

  const total = importProgress.total;
  const completed = importProgress.completed;
  const progressCompleted = done ? total : completed;
  const skipped = importProgress.textSkipped + importProgress.assetSkipped;

  if (!file || !notebookId) {
    return <Navigate to='/' replace />;
  }

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.WeuiForm.PageMain}
      pageTestId={MinimalDiaryImport.resultPage}
      contentTestId={MinimalDiaryImport.resultContent}
      header={{ showBack: true, tone: 'surface' }}
    >
      <FormPage
        title={localize('settings.import.result.title', 'Import')}
        description={file?.name}
        actions={[
          {
            disabled: !done,
            label: localize('settings.import.result.ok', 'OK'),
            testId: MinimalDiaryImport.resultOk,
            onClick: () => navigationService.goBack({ fallbackPath: '/' }),
          },
        ]}
      >
        {parsing ? (
          <div
            className={styles.MinimalDiaryImportPage.Status}
            data-test-id={MinimalDiaryImport.parseStatus}
          >
            {localize('settings.import.result.parsing', 'Parsing')}
          </div>
        ) : (
          <>
            <div data-test-id={MinimalDiaryImport.progress}>
              <ProgressBar completed={progressCompleted} total={total} />
            </div>
            <FormGroup
              title={localize('settings.import.result.summary', 'Import results')}
              testId={MinimalDiaryImport.resultStatus}
              readonly
              items={[
                {
                  label: localize('settings.import.result.textImported', 'Text'),
                  value: String(importProgress.textImported),
                },
                {
                  label: localize('settings.import.result.assetImported', 'Attachments'),
                  value: String(importProgress.assetImported),
                },
                {
                  label: localize('settings.import.result.skipped', 'Skipped'),
                  value: String(skipped),
                },
              ]}
            />
          </>
        )}
      </FormPage>
    </HeaderLayoutPage>
  );
}
