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

export interface SuccessToastOptions {
  message: string;
  /** 'check' 显示对勾（默认），'none' 只显示文字（用于轻提示/错误）。 */
  icon?: 'check' | 'none';
  durationMs?: number;
  testId?: string;
  onDone?: () => void;
}

export class SuccessToastController implements IDisposable {
  static create(options: SuccessToastOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    workbenchOverlayService.removeOverlayById(OverlayEnum.topTips);
    return workbenchOverlayService.createOverlay(
      'toast',
      OverlayEnum.successToast,
      zIndex.toast,
      (initOptions) =>
        instantiationService.createInstance(SuccessToastController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  private readonly instanceId: string;
  private readonly timer: ReturnType<typeof setTimeout>;
  private disposed = false;

  constructor(
    private readonly options: SuccessToastOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
    this.timer = setTimeout(() => this.dispose(), this.durationMs);
  }

  get message(): string {
    return this.options.message || localize('common.done', 'Done');
  }

  get icon(): 'check' | 'none' {
    return this.options.icon ?? 'check';
  }

  get durationMs(): number {
    return this.options.durationMs ?? 1500;
  }

  get testId(): string | undefined {
    return this.options.testId;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.timer);
    this.options.onDone?.();
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
