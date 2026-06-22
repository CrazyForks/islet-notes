import type {
  SyncDatabaseSnapshotMergeReturn,
  SyncDatabaseSnapshotOptions,
} from '@/base/just-vibes/file-asset-object-store';
import type { ITestInjectionService } from '@/services/e2e/common/testInjectionService';
import type { FileAssetObjectStoreController } from './fileAssetObjectStoreController';

export class DatabaseSnapshotSync {
  constructor(
    private readonly objectStoreController: FileAssetObjectStoreController,
    private readonly testInjectionService: ITestInjectionService,
  ) {}

  async syncDatabaseSnapshot(
    localSnapshot: Uint8Array,
    mergeRemoteSnapshot: (remoteSnapshot: Uint8Array) => SyncDatabaseSnapshotMergeReturn,
    options: SyncDatabaseSnapshotOptions = {},
  ): Promise<Uint8Array | undefined> {
    return this.objectStoreController
      .getObjectStore()
      .syncDatabaseSnapshot(localSnapshot, mergeRemoteSnapshot, {
        ...options,
        beforePutDatabaseSnapshot: async () => {
          await this.testInjectionService.get('fileAsset.databaseSnapshot.put');
        },
      });
  }

  async putDatabaseSnapshot(key: string, snapshot: Uint8Array): Promise<void> {
    await this.testInjectionService.get('fileAsset.databaseSnapshot.put');
    await this.objectStoreController.getObjectStore().putDatabaseSnapshot(key, snapshot);
  }

  getDatabaseSnapshot(key: string): Promise<Uint8Array | undefined> {
    return this.objectStoreController.getObjectStore().getDatabaseSnapshot(key);
  }
}
