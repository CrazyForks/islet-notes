import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { ImageLoadingSpinner } from '@/mobile/components/image/ImageLoadingSpinner';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React, { useCallback, useState } from 'react';
import { PhotoSlider } from 'react-photo-view';
import type { DataType } from 'react-photo-view/dist/types';
import { ImagePreviewController } from './ImagePreviewController';
import { PreviewOverlay } from './PreviewOverlay';

export function ImagePreview() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<ImagePreviewController>(
    OverlayEnum.imagePreview,
  );
  useWatchEvent(controller?.onStatusChange);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const handleClose = useCallback(() => {
    controller?.close();
  }, [controller]);
  useBackButton(controller ? handleClose : undefined);

  if (!controller) return null;

  const images: DataType[] = controller.previewImages.map((image) => ({
    key: image.attachment.id,
    src: image.src,
    originRef: image.originRef,
    overlay: <PreviewOverlay status={image.status} />,
  }));

  return (
    <div
      ref={setPortalContainer}
      className={styles.ImagePreview.Portal}
      data-test-id={DiaryChat.imagePreviewOverlay}
      style={{ zIndex: controller.zIndex }}
    >
      {portalContainer && (
        <PhotoSlider
          images={images}
          visible={controller.visible}
          index={controller.index}
          onIndexChange={(index) => controller.setIndex(index)}
          onClose={handleClose}
          afterClose={() => controller.dispose()}
          maskOpacity={0.92}
          photoClosable
          photoClassName={styles.ImagePreview.Photo}
          overlayRender={({ overlay }) => overlay}
          loadingElement={
            <span className={styles.ImagePreview.SpinnerBox}>
              <ImageLoadingSpinner className={styles.ImagePreview.Spinner} tone='light' />
            </span>
          }
          portalContainer={portalContainer}
        />
      )}
    </div>
  );
}
