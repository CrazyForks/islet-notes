import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { Emitter } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface TopTipsOptions {
  message: string;
  durationMs?: number;
  testId?: string;
}

export class TopTipsController implements IDisposable {
  static create(options: TopTipsOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    workbenchOverlayService.removeOverlayById(OverlayEnum.successToast);
    return workbenchOverlayService.createOverlay(
      'top-tips',
      OverlayEnum.topTips,
      zIndex.topTips,
      (initOptions) => instantiationService.createInstance(TopTipsController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  private readonly instanceId: string;
  private readonly timer: ReturnType<typeof setTimeout>;
  private disposed = false;

  constructor(
    private readonly options: TopTipsOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
    this.timer = setTimeout(() => this.dispose(), this.durationMs);
  }

  get message(): string {
    return this.options.message;
  }

  get durationMs(): number {
    return this.options.durationMs ?? 3000;
  }

  get testId(): string | undefined {
    return this.options.testId;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.timer);
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
