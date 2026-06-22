import type { ImageAttachmentRecord, VideoAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { FileUrlOptions, IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { useEffect, useState } from 'react';

type ThumbAttachment = ImageAttachmentRecord | VideoAttachmentRecord;

/** 解析附件缩略图 URL(优先 thumbS3Key)。 */
export function useAttachmentThumbUrl(
  attachment: ThumbAttachment | undefined,
  options: Pick<FileUrlOptions, 'role'>,
) {
  const fileAssetService = useService(IFileAssetService);
  const [url, setUrl] = useState<string>();
  const key =
    attachment?.type === 'video'
      ? attachment.thumbS3Key
      : (attachment?.thumbS3Key ?? attachment?.s3Key);

  useEffect(() => {
    let disposed = false;
    setUrl(undefined);
    if (!key) return;
    fileAssetService
      .getFileUrl(key, { role: options.role })
      .then((next) => {
        if (!disposed) setUrl(next);
      })
      .catch(() => {
        if (!disposed) setUrl(undefined);
      });
    return () => {
      disposed = true;
    };
  }, [fileAssetService, key, options.role]);

  return url;
}
