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
  emptyS3Config,
  testUploadConnection,
  type EditableS3Config,
} from '@/base/just-vibes/file-asset-object-store';
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

type SetupMode = 'auto' | 'import';
interface SetupRouteState {
  mode?: SetupMode;
  channel?: 's3' | 'webdav';
  uploadConfig?: EditableS3Config;
}

export function StartupSetupSyncS3Page() {
  const location = useLocation();
  const routeState = getRouteState(location.state);
  const navigate = useNavigate();
  const showLoadingToast = useLoadingToast();
  const showTopTips = useTopTips();
  const [testing, setTesting] = useState(false);
  const initialValues = routeState?.uploadConfig ?? emptyS3Config();
  const s3Form = useForm<EditableS3Config>({
    initialValues,
    requiredMessage: (field) =>
      localize('settings.sync.s3.required', '{0} is required.', field.label),
    fields: [
      {
        name: 'endpoint',
        label: 'Endpoint',
        testId: CloudSync.endpointInput,
        placeholder: 'https://s3.ap-southeast-2.amazonaws.com',
        required: true,
      },
      {
        name: 'region',
        label: 'Region',
        testId: CloudSync.regionInput,
        placeholder: 'ap-southeast-2',
        required: true,
      },
      {
        name: 'bucket',
        label: 'Bucket',
        testId: CloudSync.bucketInput,
        placeholder: 'my-vault',
        required: true,
      },
      {
        name: 'accessKeyId',
        label: 'Access Key ID',
        testId: CloudSync.accessKeyIdInput,
        placeholder: 'AKIA...',
        required: true,
      },
      {
        name: 'secretAccessKey',
        label: 'Secret Access Key',
        testId: CloudSync.secretAccessKeyInput,
        type: 'password',
        placeholder: '********',
        required: true,
      },
      {
        name: 'prefix',
        label: 'Prefix',
        testId: CloudSync.prefixInput,
        placeholder: 'chat-diary',
      },
      {
        name: 'forcePathStyle',
        label: localize('settings.sync.s3.forcePathStyle', 'Force path style'),
        testId: CloudSync.forcePathStyle,
        type: 'checkbox',
      },
    ],
  });
  const mode = routeState?.mode;

  if (!isSetupMode(mode) || routeState?.channel !== 's3') {
    return <Navigate to='/' replace />;
  }

  const proceed = async () => {
    if (testing || !s3Form.verify()) return;
    const loadingToast = showLoadingToast();
    setTesting(true);
    const result = await testUploadConnection(s3Form.values).finally(() => {
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
        channel: 's3',
        uploadConfig: s3Form.values,
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
        title={localize('settings.sync.s3.title', 'Configure S3 storage')}
        description={localize(
          'settings.sync.s3.desc',
          'Data is encrypted on this device before syncing to your S3 storage.',
        )}
        testId={CloudSync.s3Card}
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
        <FormGroup title={localize('settings.sync.storage', 'Storage')} items={s3Form.fields} />
      </FormPage>
    </HeaderLayoutPage>
  );
}

function getRouteState(state: unknown): SetupRouteState | undefined {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return undefined;
  const value = state as { mode?: unknown; channel?: unknown; uploadConfig?: unknown };
  if (!isSetupMode(value.mode)) return undefined;
  if (value.channel !== 's3') return undefined;
  return {
    mode: value.mode,
    channel: 's3',
    uploadConfig: isS3Config(value.uploadConfig) ? value.uploadConfig : undefined,
  };
}

function isSetupMode(value: unknown): value is SetupMode {
  return value === 'auto' || value === 'import';
}

function isS3Config(value: unknown): value is EditableS3Config {
  return (
    !!value && typeof value === 'object' && (value as { provider?: unknown }).provider === 's3'
  );
}

function generateRecoveryKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return chars.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}
