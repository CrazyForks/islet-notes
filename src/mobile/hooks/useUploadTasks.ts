import { useService } from '@/hooks/use-service';
import { AttachmentUploadTaskRecord } from '@/services/fileAsset/common/uploadTaskStore';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { useEffect, useState } from 'react';

export function useUploadTasks(notebookId?: string): AttachmentUploadTaskRecord[] {
  const fileAssetService = useService(IFileAssetService);
  const [tasks, setTasks] = useState<AttachmentUploadTaskRecord[]>([]);

  useEffect(() => {
    let disposed = false;
    async function load() {
      const next = await fileAssetService.listAttachmentTasks(notebookId);
      if (!disposed) setTasks(next);
    }
    void load();
    const listener = fileAssetService.onDidChangeTasks(() => {
      void load();
    });
    return () => {
      disposed = true;
      listener.dispose();
    };
  }, [fileAssetService, notebookId]);

  return tasks;
}
