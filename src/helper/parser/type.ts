export interface ImportPackage {
  source: ImportSourceInfo;
  items: ImportItem[];
  /**
   * 顺序流式输出 items 中引用到的资源内容。
   * 不保证随机访问；调用方应按 filename 匹配。
   */
  streamAssets(): AsyncIterable<ImportAssetContent>;
}

export interface ImportSourceInfo {
  type: string;
  filename: string;
  size: number;
}

export type ImportItem = ImportTextItem | ImportAssetItem;

export interface ImportTextItem {
  type: 'text';
  id: string;
  createdAt: number;
  text: string;
}

export interface ImportAssetItem {
  type: 'asset';
  id: string;
  mediaType: 'image' | 'video';
  filename: string;
  createdAt: number;
}

export interface ImportAssetContent {
  filename: string;
  mimeType?: string;
  content: Uint8Array;
}

export interface ImportProgress {
  completed: number;
  total: number;
  textImported: number;
  textSkipped: number;
  assetImported: number;
  assetSkipped: number;
}
