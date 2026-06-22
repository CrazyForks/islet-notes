import { zIndex } from '@/mobile/styles/ui';
import { HostVideoPick } from '@/services/native/common/hostService';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface VideoPreviewOptions {
  video: HostVideoPick;
  onConfirm: (originalQuality: boolean) => void;
  onCancel?: () => void;
}

export class VideoPreviewController implements IDisposable {
  static create(options: VideoPreviewOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'video-preview',
      OverlayEnum.videoPreview,
      zIndex.videoPreview,
      (initOptions) =>
        instantiationService.createInstance(VideoPreviewController, options, initOptions),
    );
  }

  readonly zIndex: number;
  private readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: VideoPreviewOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get video(): HostVideoPick {
    return this.options.video;
  }

  cancel(): void {
    this.options.onCancel?.();
    this.dispose();
  }

  confirm(originalQuality: boolean): void {
    this.options.onConfirm(originalQuality);
    this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
