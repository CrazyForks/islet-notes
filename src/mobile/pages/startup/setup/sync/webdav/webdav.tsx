import { useService } from '@/hooks/use-service';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { useForm } from '@/mobile/hooks/useForm';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { CloudSync } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import {
  emptyWebDAVConfig,
  testUploadConnection,
  type EditableWebDAVConfig,
} from '@/base/just-vibes/file-asset-object-store';
import { IHostService } from '@/services/native/common/hostService';
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

type SetupMode = 'auto' | 'import';
interface SetupRouteState {
  mode?: SetupMode;
  channel?: 's3' | 'webdav';
  uploadConfig?: EditableWebDAVConfig;
}

export function StartupSetupSyncWebdavPage() {
  const location = useLocation();
  const routeState = getRouteState(location.state);
  const navigate = useNavigate();
  const showLoadingToast = useLoadingToast();
  const showTopTips = useTopTips();
  const hostService = useService(IHostService);
  const [testing, setTesting] = useState(false);
  const initialValues = routeState?.uploadConfig ?? emptyWebDAVConfig();
  const webdavForm = useForm<EditableWebDAVConfig>({
    initialValues,
    requiredMessage: (field) =>
      localize('settings.sync.s3.required', '{0} is required.', field.label),
    fields: [
      {
        name: 'url',
        label: 'WebDAV URL',
        testId: CloudSync.webdavUrlInput,
        placeholder: 'https://dav.example.com/dav/files/me',
        required: true,
      },
      {
        name: 'username',
        label: 'Username',
        testId: CloudSync.webdavUsernameInput,
        placeholder: 'username',
      },
      {
        name: 'password',
        label: localize('settings.sync.webdav.password', 'Password or app password'),
        testId: CloudSync.webdavPasswordInput,
        type: 'password',
        placeholder: '********',
      },
      {
        name: 'prefix',
        label: 'Prefix',
        testId: CloudSync.webdavPrefixInput,
        placeholder: 'chat-diary',
      },
    ],
  });
  const mode = routeState?.mode;

  if (!isSetupMode(mode) || routeState?.channel !== 'webdav') {
    return <Navigate to='/' replace />;
  }

  const proceed = async () => {
    if (testing || !webdavForm.verify()) return;
    const loadingToast = showLoadingToast();
    setTesting(true);
    const result = await testUploadConnection(webdavForm.values, hostService).finally(() => {
      loadingToast.dispose();
      setTesting(false);
    });
    if (!result.ok) {
      showTopTips({
        message: localize(
          'settings.sync.s3.testFailed',
          'Connection test failed: {0}',
          result.error,
        ),
        testId: CloudSync.status,
      });
      return;
    }
    const path = mode === 'auto' ? '/startup/setup/key/init' : '/startup/setup/key/restore';
    navigate(path, {
      state: {
        mode,
        channel: 'webdav',
        uploadConfig: webdavForm.values,
        recoveryKey: mode === 'auto' ? generateRecoveryKey() : undefined,
      },
    });
  };
  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.S3SettingsPage.SetupContent}
      pageTestId={CloudSync.page}
      contentTestId={CloudSync.setupContent}
      header={{ tone: 'surface', showBack: true, right: { type: 'steps', total: 2, current: 1 } }}
    >
      <FormPage
        title={localize('settings.sync.webdav.title', 'Configure WebDAV storage')}
        description={localize(
          'settings.sync.webdav.desc',
          'Data is encrypted on this device before syncing to your WebDAV storage.',
        )}
        testId={CloudSync.webdavCard}
        actions={[
          {
            label: testing
              ? localize('settings.sync.s3.testingShort', 'Connecting...')
              : localize('common.next', 'Next'),
            testId: CloudSync.primaryAction,
            disabled: testing,
            onClick: () => void proceed(),
          },
        ]}
      >
        <FormGroup title={localize('settings.sync.storage', 'Storage')} items={webdavForm.fields} />
      </FormPage>
    </HeaderLayoutPage>
  );
}

function getRouteState(state: unknown): SetupRouteState | undefined {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return undefined;
  const value = state as { mode?: unknown; channel?: unknown; uploadConfig?: unknown };
  if (!isSetupMode(value.mode)) return undefined;
  if (value.channel !== 'webdav') return undefined;
  return {
    mode: value.mode,
    channel: 'webdav',
    uploadConfig: isWebDAVConfig(value.uploadConfig) ? value.uploadConfig : undefined,
  };
}

function isSetupMode(value: unknown): value is SetupMode {
  return value === 'auto' || value === 'import';
}

function isWebDAVConfig(value: unknown): value is EditableWebDAVConfig {
  return (
    !!value && typeof value === 'object' && (value as { provider?: unknown }).provider === 'webdav'
  );
}

function generateRecoveryKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return chars.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}
