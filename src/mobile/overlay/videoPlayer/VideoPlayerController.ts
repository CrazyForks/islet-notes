import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { Emitter } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface VideoPlayerOptions {
  /** 按需解析视频播放地址。 */
  loadUrl: () => Promise<string | undefined>;
}

export type VideoPlayerStatus = 'loading' | 'ready' | 'failed';

export class VideoPlayerController implements IDisposable {
  static create(options: VideoPlayerOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'video-player',
      OverlayEnum.videoPlayer,
      zIndex.videoPlayer,
      (initOptions) =>
        instantiationService.createInstance(VideoPlayerController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  private readonly instanceId: string;
  private disposed = false;
  private _status: VideoPlayerStatus = 'loading';
  private _url?: string;

  constructor(
    options: VideoPlayerOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
    void this.load(options);
  }

  get status(): VideoPlayerStatus {
    return this._status;
  }

  get url(): string | undefined {
    return this._url;
  }

  private async load(options: VideoPlayerOptions): Promise<void> {
    try {
      const url = await options.loadUrl();
      if (this.disposed) return;
      this._url = url;
      this._status = this._url ? 'ready' : 'failed';
    } catch {
      this._status = 'failed';
    }
    this._onStatusChange.fire();
  }

  close(): void {
    this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
