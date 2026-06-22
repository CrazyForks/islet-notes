import type {
  ImportAssetContent,
  ImportAssetItem,
  ImportItem,
  ImportPackage,
  ImportTextItem,
} from '@/helper/parser/type';
import { localize } from '@/nls';
import { AsyncUnzipInflate, Unzip, UnzipInflate, type UnzipFile } from 'fflate';
import {
  MINIMAL_DIARY_IMPORT_SOURCE_TYPE,
  type MinimalDiaryData,
  type MinimalDiarySourceAsset,
  type MinimalDiarySourceEntry,
  type RawMinimalDiaryEntry,
  type RawMinimalDiaryTag,
} from './type';

export async function parseMinimalDiaryImportPackage(file: File): Promise<ImportPackage> {
  const manifest = await readMinimalDiaryManifest(file);
  const data = JSON.parse(new TextDecoder().decode(manifest.dataJson)) as MinimalDiaryData;
  const tags = parseTags(data.tag);
  const entries = parseEntries(data.entry);
  const existingAssets = new Set(manifest.assetFilenames);
  const items = buildImportItems(entries, tags, existingAssets);
  const assetFilenames = new Set(
    items.flatMap((item) => {
      if (item.type !== 'asset') return [];
      return [item.filename];
    }),
  );

  return {
    source: {
      type: MINIMAL_DIARY_IMPORT_SOURCE_TYPE,
      filename: file.name,
      size: file.size,
    },
    items,
    streamAssets: () => streamMinimalDiaryAssets(file, assetFilenames),
  };
}

export function formatMinimalDiaryEntryText(
  entry: Pick<MinimalDiarySourceEntry, 'text' | 'note' | 'emotion' | 'labelIds'>,
  tags: Map<string, string>,
): string {
  const parts: string[] = [];
  if (entry.emotion.trim()) {
    parts.push(entry.emotion.trim());
  }
  if (entry.text.trim()) {
    parts.push(entry.text.trim());
  }
  if (entry.note.trim()) {
    parts.push(localize('parser.minimalDiary.note', 'Note: {0}', entry.note.trim()));
  }

  const tagNames = entry.labelIds
    .map((id) => tags.get(id) ?? id)
    .map((name) => name.trim())
    .filter(Boolean);
  if (tagNames.length > 0) {
    parts.push(
      localize(
        'parser.minimalDiary.tags',
        'Tags: {0}',
        tagNames.map((name) => `#${name}`).join(' '),
      ),
    );
  }

  return parts.join('\n\n');
}

function buildImportItems(
  entries: MinimalDiarySourceEntry[],
  tags: Map<string, string>,
  existingAssets: Set<string>,
): ImportItem[] {
  const items: ImportItem[] = [];
  for (const entry of entries) {
    const text = formatMinimalDiaryEntryText(entry, tags);
    if (text) {
      items.push(createTextItem(entry, text));
    }
    for (let index = 0; index < entry.assets.length; index += 1) {
      const asset = entry.assets[index];
      if (!existingAssets.has(asset.filename)) continue;
      items.push(createAssetItem(entry, index, asset));
    }
  }
  return items;
}

function createTextItem(entry: MinimalDiarySourceEntry, text: string): ImportTextItem {
  return {
    type: 'text',
    id: getMinimalDiaryTextItemId(entry.id),
    createdAt: entry.createdAt,
    text,
  };
}

function createAssetItem(
  entry: MinimalDiarySourceEntry,
  assetIndex: number,
  asset: MinimalDiarySourceAsset,
): ImportAssetItem {
  return {
    type: 'asset',
    id: getMinimalDiaryAssetItemId(entry.id, assetIndex, asset),
    mediaType: asset.type,
    filename: asset.filename,
    createdAt: entry.createdAt,
  };
}

function getMinimalDiaryTextItemId(sourceEntryId: string): string {
  return `minimaldiary:0-text:${sourceEntryId}`;
}

function getMinimalDiaryAssetItemId(
  sourceEntryId: string,
  assetIndex: number,
  asset: MinimalDiarySourceAsset,
): string {
  return `minimaldiary:1-${asset.type}-entry:${sourceEntryId}:${String(assetIndex).padStart(3, '0')}:${asset.filename}`;
}

interface MinimalDiaryManifest {
  dataJson: Uint8Array;
  assetFilenames: string[];
}

async function readMinimalDiaryManifest(file: File): Promise<MinimalDiaryManifest> {
  let dataJson: Uint8Array | undefined;
  const assetFilenames = new Set<string>();

  await readZipEntries(file, (zipFile) => {
    const name = basename(zipFile.name);
    if (name && isMinimalDiaryAssetPath(zipFile.name)) {
      assetFilenames.add(name);
      return;
    }
    if (name !== 'data.json') return;
    return collectZipFile(zipFile).then((content) => {
      dataJson = content;
    });
  });

  if (!dataJson) throw new Error('data.json not found in minimal diary zip.');
  return {
    dataJson,
    assetFilenames: [...assetFilenames],
  };
}

async function* streamMinimalDiaryAssets(
  file: File,
  assetFilenames: Set<string>,
): AsyncIterable<ImportAssetContent> {
  if (assetFilenames.size === 0) return;
  const queue = new AsyncQueue<ImportAssetContent>();

  readZipEntries(file, (zipFile) => {
    const filename = basename(zipFile.name);
    if (!filename || !isMinimalDiaryAssetPath(zipFile.name)) return;
    if (!assetFilenames.has(filename)) return;
    return collectZipFile(zipFile)
      .then((content) => {
        queue.push({
          filename,
          mimeType: inferMimeFromContent(content, filename),
          content,
        });
      })
      .catch((error: unknown) => queue.fail(error));
  })
    .then(() => queue.close())
    .catch((error: unknown) => queue.fail(error));

  yield* queue;
}

function readZipEntries(
  file: File,
  onFile: (file: UnzipFile) => Promise<void> | void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const pending: Promise<void>[] = [];
    const unzip = new Unzip((zipFile) => {
      try {
        const task = onFile(zipFile);
        if (task) pending.push(task);
      } catch (error) {
        reject(error);
      }
    });
    unzip.register(UnzipInflate);
    unzip.register(AsyncUnzipInflate);
    const reader = file.stream().getReader();

    const pump = (): void => {
      reader
        .read()
        .then(({ value, done }) => {
          try {
            if (done) {
              unzip.push(new Uint8Array(), true);
              Promise.all(pending).then(() => resolve(), reject);
              return;
            }
            unzip.push(value, false);
            pump();
          } catch (error) {
            reject(error);
          }
        })
        .catch(reject);
    };

    pump();
  });
}

function collectZipFile(file: UnzipFile): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    file.ondata = (error, chunk, final) => {
      if (error) {
        reject(error);
        return;
      }
      if (chunk) {
        chunks.push(chunk);
        size += chunk.byteLength;
      }
      if (final) resolve(concatChunks(chunks, size));
    };
    file.start();
  });
}

class AsyncQueue<T> implements AsyncIterable<T> {
  private readonly values: T[] = [];
  private readonly waiters: Array<{
    resolve: (result: IteratorResult<T>) => void;
    reject: (error: unknown) => void;
  }> = [];
  private closed = false;
  private error: unknown;

  push(value: T): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve({ value, done: false });
      return;
    }
    this.values.push(value);
  }

  close(): void {
    this.closed = true;
    this.flush();
  }

  fail(error: unknown): void {
    this.error = error;
    this.closed = true;
    this.flush();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      const result = await this.next();
      if (result.done) return;
      yield result.value;
    }
  }

  private next(): Promise<IteratorResult<T>> {
    if (this.values.length > 0) {
      return Promise.resolve({ value: this.values.shift() as T, done: false });
    }
    if (this.error) return Promise.reject(this.error);
    if (this.closed) return Promise.resolve({ value: undefined, done: true });
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  private flush(): void {
    while (this.waiters.length > 0 && (this.error || this.closed)) {
      const waiter = this.waiters.shift();
      if (!waiter) continue;
      if (this.error) {
        waiter.reject(this.error);
      } else {
        waiter.resolve({ value: undefined, done: true });
      }
    }
  }
}

function concatChunks(chunks: Uint8Array[], size: number): Uint8Array {
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function parseEntries(rawEntries: unknown): MinimalDiarySourceEntry[] {
  if (!Array.isArray(rawEntries)) return [];

  return rawEntries
    .map((raw, index) => parseEntry(raw as RawMinimalDiaryEntry, index))
    .filter((entry): entry is MinimalDiarySourceEntry => !!entry)
    .sort((left, right) => {
      if (left.createdAt !== right.createdAt) return left.createdAt - right.createdAt;
      return left.id.localeCompare(right.id);
    });
}

function parseEntry(
  raw: RawMinimalDiaryEntry,
  fallbackIndex: number,
): MinimalDiarySourceEntry | undefined {
  const id = asString(raw.id) || `entry-${fallbackIndex}`;
  const createdAt = asTimestamp(raw.createdAt);
  if (createdAt === undefined) return undefined;
  return {
    id,
    text: asString(raw.text),
    note: asString(raw.note),
    emotion: asString(raw.emotion),
    createdAt,
    updatedAt: asTimestamp(raw.updateAt) ?? createdAt,
    labelIds: splitCsv(asString(raw.labelIds)),
    assets: collectSourceAssets(raw),
  };
}

function collectSourceAssets(raw: RawMinimalDiaryEntry): MinimalDiarySourceAsset[] {
  const assets: MinimalDiarySourceAsset[] = [];
  assets.push(
    ...splitCsv(asString(raw.images))
      .map(basename)
      .filter(Boolean)
      .map((filename) => ({ type: 'image' as const, filename })),
  );

  if (Array.isArray(raw.assets)) {
    for (const asset of raw.assets) {
      if (!asset || typeof asset !== 'object') continue;
      const record = asset as Record<string, unknown>;
      const type = asString(record.type);
      if (type === 'image') {
        const filename = basename(asString(record.imageFilename));
        if (filename) assets.push({ type: 'image', filename });
      }
      if (type === 'video') {
        const filename = basename(asString(record.videoFilename));
        if (!filename) continue;
        assets.push({
          type: 'video',
          filename,
        });
      }
    }
  }

  return uniqueAssets(assets);
}

function parseTags(rawTags: unknown): Map<string, string> {
  const tags = new Map<string, string>();
  if (!Array.isArray(rawTags)) return tags;

  for (const raw of rawTags as RawMinimalDiaryTag[]) {
    const id = asString(raw.id);
    const text = asString(raw.text);
    if (id && text) tags.set(id, text);
  }
  return tags;
}

function inferMimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function inferMimeFromContent(content: Uint8Array, filename: string): string {
  if (content[0] === 0x89 && content[1] === 0x50 && content[2] === 0x4e && content[3] === 0x47) {
    return 'image/png';
  }
  if (
    content[0] === 0xff &&
    content[1] === 0xd8 &&
    content[content.byteLength - 2] === 0xff &&
    content[content.byteLength - 1] === 0xd9
  ) {
    return 'image/jpeg';
  }
  if (
    content[0] === 0x52 &&
    content[1] === 0x49 &&
    content[2] === 0x46 &&
    content[3] === 0x46 &&
    content[8] === 0x57 &&
    content[9] === 0x45 &&
    content[10] === 0x42 &&
    content[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (content[4] === 0x66 && content[5] === 0x74 && content[6] === 0x79 && content[7] === 0x70) {
    return 'video/mp4';
  }
  return inferMimeFromFilename(filename);
}

function isMinimalDiaryAssetPath(path: string): boolean {
  return path.split('/').filter(Boolean).slice(0, -1).includes('Pictures');
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asTimestamp(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function basename(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? '';
}

function uniqueAssets(values: MinimalDiarySourceAsset[]): MinimalDiarySourceAsset[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = `${value.type}\n${value.filename}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
