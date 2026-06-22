import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface DialogOptions {
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
  rootTestId?: string;
  dialogTestId?: string;
  confirmTestId?: string;
  cancelTestId?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export class DialogController implements IDisposable {
  static create(options: DialogOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.dialog,
      zIndex.dialog,
      (initOptions) => instantiationService.createInstance(DialogController, options, initOptions),
    );
  }

  readonly zIndex: number;
  private readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: DialogOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get title(): string | undefined {
    return this.options.title;
  }

  get message(): string {
    return this.options.message;
  }

  get rootTestId(): string | undefined {
    return this.options.rootTestId;
  }

  get dialogTestId(): string | undefined {
    return this.options.dialogTestId;
  }

  get confirmLabel(): string {
    return this.options.confirmLabel;
  }

  get cancelLabel(): string {
    return this.options.cancelLabel;
  }

  get tone(): 'danger' | 'primary' {
    return this.options.tone ?? 'danger';
  }

  get confirmTestId(): string | undefined {
    return this.options.confirmTestId;
  }

  get cancelTestId(): string | undefined {
    return this.options.cancelTestId;
  }

  cancel(): void {
    this.options.onCancel?.();
    this.dispose();
  }

  confirm(): void {
    void Promise.resolve(this.options.onConfirm()).finally(() => this.dispose());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
