import { getProfileAvatarAttachment } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { useCallback, useEffect, useState } from 'react';

/** 解析当前用户头像 URL(优先缩略图,加载失败时自动刷新一次)。 */
export function useProfileAvatar() {
  const model = useDiaryModel();
  const fileAssetService = useService(IFileAssetService);
  const candidate = getProfileAvatarAttachment(model);
  const attachment = candidate?.type === 'image' ? candidate : undefined;
  const [url, setUrl] = useState<string>();
  const key = attachment?.thumbS3Key ?? attachment?.s3Key;

  useEffect(() => {
    let disposed = false;
    async function load() {
      setUrl(undefined);
      if (!key) {
        return;
      }
      try {
        const nextUrl = await fileAssetService.getFileUrl(key, {
          role: 'avatar',
        });
        if (!disposed) setUrl(nextUrl);
      } catch {
        if (!disposed) setUrl(undefined);
      }
    }
    void load();
    return () => {
      disposed = true;
    };
  }, [fileAssetService, key]);

  const handleImageError = useCallback(() => {
    setUrl(undefined);
  }, []);

  return { url, handleImageError };
}
