export const LOCAL_DIARY_SCOPE_ID = 'local';

export interface IDiaryStorage {
  save(content: string): Promise<string>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  read(key: string): Promise<string>;
}
