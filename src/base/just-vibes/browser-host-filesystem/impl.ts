// @islet-import-scope same-dir

const DATABASE_NAME = 'islet-browser-host-filesystem';
const DATABASE_VERSION = 1;
const DIRECTORIES_STORE = 'directories';
const FILES_STORE = 'files';

interface BrowserHostFilesystemPathOptions {
  path: string;
}

interface BrowserHostFilesystemMkdirOptions extends BrowserHostFilesystemPathOptions {
  recursive?: boolean;
}

type BrowserHostFilesystemReadFileOptions = BrowserHostFilesystemPathOptions;

interface BrowserHostFilesystemWriteFileOptions extends BrowserHostFilesystemPathOptions {
  data: string;
}

interface BrowserHostFilesystemRmdirOptions extends BrowserHostFilesystemPathOptions {
  recursive?: boolean;
}

interface BrowserHostFilesystemRenameOptions {
  from: string;
  to: string;
}

interface BrowserHostFilesystemReaddirResult {
  files: BrowserHostFilesystemFileInfo[];
}

interface BrowserHostFilesystemFileInfo {
  name: string;
  type?: 'file' | 'directory';
}

interface BrowserHostFilesystemReadFileResult {
  data: string;
}

export interface BrowserHostFilesystem {
  readdir(options: BrowserHostFilesystemPathOptions): Promise<BrowserHostFilesystemReaddirResult>;
  mkdir(options: BrowserHostFilesystemMkdirOptions): Promise<void>;
  readFile(
    options: BrowserHostFilesystemReadFileOptions,
  ): Promise<BrowserHostFilesystemReadFileResult>;
  writeFile(options: BrowserHostFilesystemWriteFileOptions): Promise<void>;
  rmdir(options: BrowserHostFilesystemRmdirOptions): Promise<void>;
  deleteFile(options: BrowserHostFilesystemPathOptions): Promise<void>;
  rename(options: BrowserHostFilesystemRenameOptions): Promise<void>;
}

interface DirectoryRecord {
  path: string;
}

interface FileRecord {
  path: string;
  data: string;
}

export function createBrowserHostFilesystem(useMemoryFilesystem: boolean): BrowserHostFilesystem {
  return useMemoryFilesystem ? createMemoryHostFilesystem() : createIndexedDbHostFilesystem();
}

export function createMemoryHostFilesystem(): BrowserHostFilesystem {
  return new MemoryHostFilesystem();
}

export function createIndexedDbHostFilesystem(): BrowserHostFilesystem {
  return new IndexedDbHostFilesystem();
}

class MemoryHostFilesystem implements BrowserHostFilesystem {
  private readonly directories = new Set<string>(['']);
  private readonly files = new Map<string, string>();

  async readdir(
    options: BrowserHostFilesystemPathOptions,
  ): Promise<BrowserHostFilesystemReaddirResult> {
    const path = normalizePath(options.path);
    this.assertDirectory(path);
    const childNames = new Map<string, BrowserHostFilesystemFileInfo>();
    const prefix = path ? `${path}/` : '';
    for (const directory of this.directories) {
      if (directory === path || !directory.startsWith(prefix)) continue;
      const rest = directory.slice(prefix.length);
      const name = rest.split('/')[0];
      if (name) childNames.set(name, { name, type: 'directory' });
    }
    for (const file of this.files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const rest = file.slice(prefix.length);
      const name = rest.split('/')[0];
      if (name && !childNames.has(name)) childNames.set(name, { name, type: 'file' });
    }
    return { files: [...childNames.values()] };
  }

  async mkdir(options: BrowserHostFilesystemMkdirOptions): Promise<void> {
    const path = normalizePath(options.path);
    if (!path) return;
    if (!options.recursive) {
      this.assertDirectory(parentPath(path));
      this.directories.add(path);
      return;
    }
    let current = '';
    for (const segment of path.split('/')) {
      current = current ? `${current}/${segment}` : segment;
      this.directories.add(current);
    }
  }

  async readFile(
    options: BrowserHostFilesystemReadFileOptions,
  ): Promise<BrowserHostFilesystemReadFileResult> {
    const path = normalizePath(options.path);
    const data = this.files.get(path);
    if (data === undefined) throw new Error(`File does not exist: ${path}`);
    return { data };
  }

  async writeFile(options: BrowserHostFilesystemWriteFileOptions): Promise<void> {
    const path = normalizePath(options.path);
    this.assertDirectory(parentPath(path));
    this.files.set(path, options.data);
  }

  async rmdir(options: BrowserHostFilesystemRmdirOptions): Promise<void> {
    const path = normalizePath(options.path);
    this.assertDirectory(path);
    const prefix = `${path}/`;
    const hasChildren =
      [...this.directories].some((directory) => directory.startsWith(prefix)) ||
      [...this.files.keys()].some((file) => file.startsWith(prefix));
    if (hasChildren && !options.recursive) {
      throw new Error(`Directory is not empty: ${path}`);
    }
    for (const directory of this.directories) {
      if (directory === path || directory.startsWith(prefix)) this.directories.delete(directory);
    }
    for (const file of this.files.keys()) {
      if (file.startsWith(prefix)) this.files.delete(file);
    }
  }

  async deleteFile(options: BrowserHostFilesystemPathOptions): Promise<void> {
    const path = normalizePath(options.path);
    if (!this.files.delete(path)) throw new Error(`File does not exist: ${path}`);
  }

  async rename(options: BrowserHostFilesystemRenameOptions): Promise<void> {
    const from = normalizePath(options.from);
    const to = normalizePath(options.to);
    const data = this.files.get(from);
    if (data === undefined) throw new Error(`File does not exist: ${from}`);
    this.assertDirectory(parentPath(to));
    this.files.set(to, data);
    this.files.delete(from);
  }

  private assertDirectory(path: string): void {
    if (!this.directories.has(path)) throw new Error(`Directory does not exist: ${path}`);
  }
}

class IndexedDbHostFilesystem implements BrowserHostFilesystem {
  private readonly dbLoad: Promise<IDBDatabase>;

  constructor() {
    this.dbLoad = openDatabase();
  }

  async readdir(
    options: BrowserHostFilesystemPathOptions,
  ): Promise<BrowserHostFilesystemReaddirResult> {
    const path = normalizePath(options.path);
    await this.assertDirectory(path);
    const childNames = new Map<string, BrowserHostFilesystemFileInfo>();
    const prefix = path ? `${path}/` : '';
    const { directories, files } = await this.listPaths();

    for (const directory of directories) {
      if (directory === path || !directory.startsWith(prefix)) continue;
      const name = directory.slice(prefix.length).split('/')[0];
      if (name) childNames.set(name, { name, type: 'directory' });
    }

    for (const file of files) {
      if (!file.startsWith(prefix)) continue;
      const name = file.slice(prefix.length).split('/')[0];
      if (name && !childNames.has(name)) childNames.set(name, { name, type: 'file' });
    }

    return { files: [...childNames.values()] };
  }

  async mkdir(options: BrowserHostFilesystemMkdirOptions): Promise<void> {
    const path = normalizePath(options.path);
    if (!path) return;
    if (!options.recursive) {
      await this.assertDirectory(parentPath(path));
      const db = await this.dbLoad;
      const tx = db.transaction(DIRECTORIES_STORE, 'readwrite');
      const done = waitForTransaction(tx);
      putRecord(tx.objectStore(DIRECTORIES_STORE), { path });
      await done;
      return;
    }

    const db = await this.dbLoad;
    const tx = db.transaction(DIRECTORIES_STORE, 'readwrite');
    const done = waitForTransaction(tx);
    const store = tx.objectStore(DIRECTORIES_STORE);
    let current = '';
    for (const segment of path.split('/')) {
      current = current ? `${current}/${segment}` : segment;
      putRecord(store, { path: current });
    }
    await done;
  }

  async readFile(
    options: BrowserHostFilesystemReadFileOptions,
  ): Promise<BrowserHostFilesystemReadFileResult> {
    const path = normalizePath(options.path);
    const record = await this.readFileRecord(path);
    if (!record) throw new Error(`File does not exist: ${path}`);
    return { data: record.data };
  }

  async writeFile(options: BrowserHostFilesystemWriteFileOptions): Promise<void> {
    const path = normalizePath(options.path);
    await this.assertDirectory(parentPath(path));
    const db = await this.dbLoad;
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const done = waitForTransaction(tx);
    putRecord(tx.objectStore(FILES_STORE), { path, data: options.data });
    await done;
  }

  async rmdir(options: BrowserHostFilesystemRmdirOptions): Promise<void> {
    const path = normalizePath(options.path);
    await this.assertDirectory(path);
    const prefix = `${path}/`;
    const { directories, files } = await this.listPaths();
    const childDirectories = directories.filter((directory) => directory.startsWith(prefix));
    const childFiles = files.filter((file) => file.startsWith(prefix));
    if ((childDirectories.length || childFiles.length) && !options.recursive) {
      throw new Error(`Directory is not empty: ${path}`);
    }

    const db = await this.dbLoad;
    const tx = db.transaction([DIRECTORIES_STORE, FILES_STORE], 'readwrite');
    const done = waitForTransaction(tx);
    const directoryStore = tx.objectStore(DIRECTORIES_STORE);
    const fileStore = tx.objectStore(FILES_STORE);
    deleteRecord(directoryStore, path);
    for (const directory of childDirectories) {
      deleteRecord(directoryStore, directory);
    }
    for (const file of childFiles) {
      deleteRecord(fileStore, file);
    }
    await done;
  }

  async deleteFile(options: BrowserHostFilesystemPathOptions): Promise<void> {
    const path = normalizePath(options.path);
    const record = await this.readFileRecord(path);
    if (!record) throw new Error(`File does not exist: ${path}`);
    const db = await this.dbLoad;
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const done = waitForTransaction(tx);
    deleteRecord(tx.objectStore(FILES_STORE), path);
    await done;
  }

  async rename(options: BrowserHostFilesystemRenameOptions): Promise<void> {
    const from = normalizePath(options.from);
    const to = normalizePath(options.to);
    await this.assertDirectory(parentPath(to));
    const record = await this.readFileRecord(from);
    if (!record) throw new Error(`File does not exist: ${from}`);

    const db = await this.dbLoad;
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const done = waitForTransaction(tx);
    const store = tx.objectStore(FILES_STORE);
    putRecord(store, { path: to, data: record.data });
    deleteRecord(store, from);
    await done;
  }

  private async assertDirectory(path: string): Promise<void> {
    const db = await this.dbLoad;
    const tx = db.transaction(DIRECTORIES_STORE, 'readonly');
    const done = waitForTransaction(tx);
    const record = await getRecord<DirectoryRecord>(tx.objectStore(DIRECTORIES_STORE), path);
    await done;
    if (!record) throw new Error(`Directory does not exist: ${path}`);
  }

  private async readFileRecord(path: string): Promise<FileRecord | undefined> {
    const db = await this.dbLoad;
    const tx = db.transaction(FILES_STORE, 'readonly');
    const done = waitForTransaction(tx);
    const record = await getRecord<FileRecord>(tx.objectStore(FILES_STORE), path);
    await done;
    return record;
  }

  // Directory enumeration only needs the keys (paths); reading full records
  // here would pull every file's payload into memory on each readdir.
  private async listPaths(): Promise<{ directories: string[]; files: string[] }> {
    const db = await this.dbLoad;
    const tx = db.transaction([DIRECTORIES_STORE, FILES_STORE], 'readonly');
    const done = waitForTransaction(tx);
    const [directories, files] = await Promise.all([
      getAllKeys(tx.objectStore(DIRECTORIES_STORE)),
      getAllKeys(tx.objectStore(FILES_STORE)),
    ]);
    await done;
    return { directories, files };
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      const directories = db.objectStoreNames.contains(DIRECTORIES_STORE)
        ? request.transaction!.objectStore(DIRECTORIES_STORE)
        : db.createObjectStore(DIRECTORIES_STORE, { keyPath: 'path' });
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'path' });
      }
      directories.put({ path: '' });
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function getRecord<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB get failed.'));
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

function getAllKeys(store: IDBObjectStore): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAllKeys();
    request.onerror = () => reject(request.error ?? new Error('IndexedDB getAllKeys failed.'));
    request.onsuccess = () => resolve(request.result as string[]);
  });
}

function putRecord(store: IDBObjectStore, value: unknown): void {
  store.put(value);
}

function deleteRecord(store: IDBObjectStore, key: IDBValidKey): void {
  store.delete(key);
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/');
}

function parentPath(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}
