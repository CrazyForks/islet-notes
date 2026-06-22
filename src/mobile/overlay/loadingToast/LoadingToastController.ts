import { localize } from '@/nls';
import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { Emitter } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface LoadingToastOptions {
  message?: string;
}

export class LoadingToastController implements IDisposable {
  static create(options: LoadingToastOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'toast',
      OverlayEnum.loadingToast,
      zIndex.toast,
      (initOptions) =>
        instantiationService.createInstance(LoadingToastController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  private readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: LoadingToastOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get message(): string {
    return this.options.message ?? localize('common.loading', 'Loading...');
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
