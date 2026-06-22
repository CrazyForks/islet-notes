export const MINIMAL_DIARY_IMPORT_SOURCE_TYPE = 'minimal-diary';

export interface MinimalDiarySourceEntry {
  id: string;
  text: string;
  note: string;
  emotion: string;
  createdAt: number;
  updatedAt: number;
  labelIds: string[];
  assets: MinimalDiarySourceAsset[];
}

export interface MinimalDiarySourceAsset {
  type: 'image' | 'video';
  filename: string;
}

export interface MinimalDiaryData {
  entry?: unknown;
  tag?: unknown;
}

export interface RawMinimalDiaryEntry {
  id?: unknown;
  text?: unknown;
  note?: unknown;
  emotion?: unknown;
  createdAt?: unknown;
  updateAt?: unknown;
  labelIds?: unknown;
  images?: unknown;
  assets?: unknown;
}

export interface RawMinimalDiaryTag {
  id?: unknown;
  text?: unknown;
}
