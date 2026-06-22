const DATABASE_NAME = 'islet-browser-attachment-blob-store';
const DATABASE_VERSION = 1;
const BLOBS_STORE = 'blobs';

export interface BrowserAttachmentBlobUrlHandle {
  url: string;
  dispose(): void;
}

export interface BrowserAttachmentBlobStore {
  save(options: BrowserAttachmentBlobSaveOptions): Promise<void>;
  read(options: BrowserAttachmentBlobKeyOptions): Promise<Blob>;
  delete(options: BrowserAttachmentBlobKeyOptions): Promise<void>;
  acquireUrl(options: BrowserAttachmentBlobKeyOptions): Promise<BrowserAttachmentBlobUrlHandle>;
}

interface BrowserAttachmentBlobKeyOptions {
  scope: string;
  key: string;
}

interface BrowserAttachmentBlobSaveOptions extends BrowserAttachmentBlobKeyOptions {
  blob: Blob;
}

interface BrowserAttachmentBlobRecord {
  id: string;
  blob: Blob;
}

export function createBrowserAttachmentBlobStore(
  useMemoryStore: boolean,
): BrowserAttachmentBlobStore {
  return useMemoryStore
    ? new MemoryBrowserAttachmentBlobStore()
    : new IndexedDbBrowserAttachmentBlobStore();
}

class MemoryBrowserAttachmentBlobStore implements BrowserAttachmentBlobStore {
  private readonly records = new Map<string, Blob>();

  async save(options: BrowserAttachmentBlobSaveOptions): Promise<void> {
    this.records.set(buildRecordId(options), options.blob);
  }

  async read(options: BrowserAttachmentBlobKeyOptions): Promise<Blob> {
    const blob = this.records.get(buildRecordId(options));
    if (!blob) throw new Error('Local file is missing.');
    return blob;
  }

  async delete(options: BrowserAttachmentBlobKeyOptions): Promise<void> {
    this.records.delete(buildRecordId(options));
  }

  async acquireUrl(
    options: BrowserAttachmentBlobKeyOptions,
  ): Promise<BrowserAttachmentBlobUrlHandle> {
    return blobToUrlHandle(await this.read(options));
  }
}

class IndexedDbBrowserAttachmentBlobStore implements BrowserAttachmentBlobStore {
  private readonly dbLoad: Promise<IDBDatabase>;

  constructor() {
    this.dbLoad = openDatabase();
  }

  async save(options: BrowserAttachmentBlobSaveOptions): Promise<void> {
    const db = await this.dbLoad;
    const tx = db.transaction(BLOBS_STORE, 'readwrite');
    const done = waitForTransaction(tx);
    tx.objectStore(BLOBS_STORE).put({
      id: buildRecordId(options),
      blob: options.blob,
    });
    await done;
  }

  async read(options: BrowserAttachmentBlobKeyOptions): Promise<Blob> {
    const db = await this.dbLoad;
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const done = waitForTransaction(tx);
    const record = await getRecord<BrowserAttachmentBlobRecord>(
      tx.objectStore(BLOBS_STORE),
      buildRecordId(options),
    );
    await done;
    if (!record?.blob) throw new Error('Local file is missing.');
    return record.blob;
  }

  async delete(options: BrowserAttachmentBlobKeyOptions): Promise<void> {
    const db = await this.dbLoad;
    const tx = db.transaction(BLOBS_STORE, 'readwrite');
    const done = waitForTransaction(tx);
    tx.objectStore(BLOBS_STORE).delete(buildRecordId(options));
    await done;
  }

  async acquireUrl(
    options: BrowserAttachmentBlobKeyOptions,
  ): Promise<BrowserAttachmentBlobUrlHandle> {
    return blobToUrlHandle(await this.read(options));
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function getRecord<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB get failed.'));
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

function buildRecordId(options: BrowserAttachmentBlobKeyOptions): string {
  // 附件二进制只按 scope + key 存储；native 侧 AttachmentFileCache 用同样的格式做 SHA-256。
  return `${options.scope}\n${options.key}`;
}

function blobToUrlHandle(blob: Blob): BrowserAttachmentBlobUrlHandle {
  if (typeof URL.createObjectURL !== 'function') throw new Error('Object URL is not available.');
  const url = URL.createObjectURL(blob);
  let disposed = false;
  return {
    url,
    dispose() {
      if (disposed) return;
      disposed = true;
      URL.revokeObjectURL(url);
    },
  };
}
