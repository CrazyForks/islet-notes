// @islet-import-scope same-dir

import { loadLoro } from '@/core/diary/loro';
import { syncStoragePath } from '@/core/spec/syncStoragePath';
import {
  decryptDatabaseSnapshot,
  deriveRecoveryKeyHash,
} from '@/base/just-vibes/attachment-encryption';
import { createSyncObjectStorage } from './syncStorage';
import type { ObjectStorageHostBridge } from './objectStorage';
import type { EditableUploadConfig } from './uploadConfig';

export interface VerifyExistingSyncResult {
  ok: boolean;
  error?: string;
  /** 解密后的远端主数据库，校验通过时返回。 */
  snapshot?: Uint8Array;
}

/**
 * 导入已有同步时，需要远端存在 <prefix>/<recoveryKeyHash>/main.db，
 * 且这个数据库能用当前恢复密钥解密并被 Loro 载入。
 */
export async function verifyExistingSync(
  config: EditableUploadConfig,
  recoveryKey: string,
  hostService?: ObjectStorageHostBridge,
): Promise<VerifyExistingSyncResult> {
  try {
    const trimmedKey = recoveryKey.trim();
    const recoveryKeyHash = await deriveRecoveryKeyHash(trimmedKey);
    const fullConfig = { ...config, recoveryKeyHash, updatedAt: Date.now() };
    const mainKey = syncStoragePath.remote.databaseMain(fullConfig);
    const payload = await createSyncObjectStorage(fullConfig, hostService).getObjectBytes(mainKey);
    if (!payload) {
      return { ok: false, error: 'Remote main database was not found.' };
    }
    const snapshot = await decryptDatabaseSnapshot(payload, trimmedKey, recoveryKeyHash);
    await assertImportableSnapshot(snapshot);
    return { ok: true, snapshot };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * decryptDatabaseSnapshot 会兼容历史明文数据库；因此远端 main.db 如果不是加密信封，
 * 也可能原样返回。保存配置前需要确认 Loro 可以载入它。
 */
async function assertImportableSnapshot(snapshot: Uint8Array): Promise<void> {
  const { LoroDoc } = await loadLoro();
  new LoroDoc().import(snapshot);
}
