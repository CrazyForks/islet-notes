import { IHostService } from '@/services/native/common/hostService';
import { nanoid } from 'nanoid';
import { IDiaryStorage } from './storage';

export class FileStorage implements IDiaryStorage {
  private readonly fileExt = '.chat_diary';
  private readonly tmpExt = '.tmp';

  constructor(
    private readonly baseDir: string,
    private readonly hostService: IHostService,
  ) {}

  private async ensureBaseDir(): Promise<void> {
    try {
      await this.hostService.readdir({ path: this.baseDir });
    } catch {
      await this.hostService.mkdir({ path: this.baseDir, recursive: true });
    }
  }

  // Write to a temp name first, then rename. Rename is atomic on the target
  // filesystems, so a process kill mid-write leaves only an invisible *.tmp
  // file and never a truncated snapshot under the real key.
  async save(content: string): Promise<string> {
    await this.ensureBaseDir();
    const key = nanoid();
    await this.hostService.writeFile({
      path: `${this.baseDir}/${key}${this.tmpExt}`,
      data: content,
    });
    await this.hostService.rename({
      from: `${this.baseDir}/${key}${this.tmpExt}`,
      to: `${this.baseDir}/${key}${this.fileExt}`,
    });
    return key;
  }

  async delete(key: string): Promise<void> {
    await this.hostService.deleteFile({
      path: `${this.baseDir}/${key}${this.fileExt}`,
    });
  }

  async list(): Promise<string[]> {
    try {
      await this.ensureBaseDir();
      const result = await this.hostService.readdir({ path: this.baseDir });
      await this.sweepTempFiles(result.files);
      return result.files
        .filter((file) => file.name.endsWith(this.fileExt))
        .map((file) => file.name.replace(this.fileExt, ''));
    } catch {
      return [];
    }
  }

  private async sweepTempFiles(files: Array<{ name: string }>): Promise<void> {
    const staleTempFiles = files.filter((file) => file.name.endsWith(this.tmpExt));
    await Promise.all(
      staleTempFiles.map((file) =>
        this.hostService
          .deleteFile({
            path: `${this.baseDir}/${file.name}`,
          })
          .catch(() => undefined),
      ),
    );
  }

  async read(key: string): Promise<string> {
    const result = await this.hostService.readFile({
      path: `${this.baseDir}/${key}${this.fileExt}`,
    });
    return result.data;
  }
}
