import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface TextInputDialogOptions {
  title: string;
  value: string;
  placeholder?: string;
  saveLabel: string;
  cancelLabel: string;
  rootTestId?: string;
  inputTestId?: string;
  saveTestId?: string;
  cancelTestId?: string;
  onSave: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

export class TextInputDialogController implements IDisposable {
  static create(options: TextInputDialogOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.textInputDialog,
      zIndex.dialog,
      (initOptions) =>
        instantiationService.createInstance(TextInputDialogController, options, initOptions),
    );
  }

  readonly zIndex: number;
  readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: TextInputDialogOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get title(): string {
    return this.options.title;
  }

  get value(): string {
    return this.options.value;
  }

  get placeholder(): string | undefined {
    return this.options.placeholder;
  }

  get saveLabel(): string {
    return this.options.saveLabel;
  }

  get cancelLabel(): string {
    return this.options.cancelLabel;
  }

  get rootTestId(): string | undefined {
    return this.options.rootTestId;
  }

  get inputTestId(): string | undefined {
    return this.options.inputTestId;
  }

  get saveTestId(): string | undefined {
    return this.options.saveTestId;
  }

  get cancelTestId(): string | undefined {
    return this.options.cancelTestId;
  }

  cancel(): void {
    this.options.onCancel?.();
    this.dispose();
  }

  save(value: string): void {
    void Promise.resolve(this.options.onSave(value)).finally(() => this.dispose());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
