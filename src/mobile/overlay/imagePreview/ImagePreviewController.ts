import { ImageAttachmentRecord } from '@/core/diary/type';
import { loadImageUrl } from '@/mobile/utils/imageLoad';
import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { Emitter } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import type React from 'react';

export interface ImagePreviewOptions {
  attachments: ImageAttachmentRecord[];
  initialAttachmentId: string;
  originRef?: React.MutableRefObject<HTMLElement | null>;
}

type PreviewStatus = 'idle' | 'loading' | 'loaded' | 'failed';

interface PreviewImageState {
  attachment: ImageAttachmentRecord;
  src?: string;
  status: PreviewStatus;
  originRef?: React.MutableRefObject<HTMLElement | null>;
}

export class ImagePreviewController implements IDisposable {
  static create(options: ImagePreviewOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'image-preview',
      OverlayEnum.imagePreview,
      zIndex.imagePreview,
      (initOptions) =>
        instantiationService.createInstance(ImagePreviewController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  private readonly instanceId: string;
  private readonly images: PreviewImageState[];
  private readonly loads = new Map<string, Promise<void>>();
  private disposed = false;
  private _visible = true;
  private _index: number;

  constructor(
    options: ImagePreviewOptions,
    initOptions: OverlayInitOptions,
    @IFileAssetService private readonly fileAssetService: IFileAssetService,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
    const fallbackAttachment = options.attachments.find(
      (attachment) => attachment.id === options.initialAttachmentId,
    );
    const attachments = options.attachments.length
      ? options.attachments
      : fallbackAttachment
        ? [fallbackAttachment]
        : [];
    this.images = attachments.map((attachment) => ({
      attachment,
      status: 'idle',
    }));
    this._index = Math.max(
      0,
      this.images.findIndex((image) => image.attachment.id === options.initialAttachmentId),
    );
    const initialImage = this.images[this._index];
    if (initialImage && options.originRef) {
      initialImage.originRef = options.originRef;
    }
    this.loadCurrent();
  }

  get visible(): boolean {
    return this._visible;
  }

  get index(): number {
    return this._index;
  }

  get previewImages(): PreviewImageState[] {
    return this.images;
  }

  setIndex(index: number): void {
    this._index = index;
    this.loadCurrent();
    this._onStatusChange.fire();
  }

  close(): void {
    if (!this._visible) return;
    this._visible = false;
    this._onStatusChange.fire();
  }

  loadCurrent(): void {
    const image = this.images[this._index];
    if (!image) return;
    // object URL 可能已被 attachment-url-cache 的 LRU 回收，所以每次显示都重新解析：
    // 命中缓存会复用同一个 URL；已淘汰则重新 acquire 一个，避免滑回时拿到已 revoke 的 URL。
    this.loadImage(image);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }

  private loadImage(image: PreviewImageState): void {
    const { attachment } = image;
    if (!attachment.s3Key) {
      image.status = 'failed';
      this._onStatusChange.fire();
      return;
    }

    // 同一张图已有进行中的加载时不重复发起。
    if (this.loads.has(attachment.id)) return;

    // 已有可用 src 时静默刷新，避免滑回已加载图片时闪一下 loading。
    if (!image.src) {
      image.status = 'loading';
      this._onStatusChange.fire();
    }
    const load = loadImageUrl(this.fileAssetService, attachment.s3Key, {
      role: 'large',
    })
      .then((url) => {
        if (this.disposed) return;
        image.src = url;
        image.status = url ? 'loaded' : 'failed';
      })
      .catch(() => {
        if (this.disposed) return;
        // 刷新失败但已有可显示的 src 时保留原图，不退化成错误态。
        if (!image.src) image.status = 'failed';
      })
      .finally(() => {
        this.loads.delete(attachment.id);
        this._onStatusChange.fire();
      });
    this.loads.set(attachment.id, load);
  }
}
