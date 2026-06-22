import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface ActionSheetAction {
  id: string;
  label: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  keepOpen?: boolean;
  testId?: string;
  run: () => void | Promise<void>;
}

export interface ActionSheetOptions {
  title?: string;
  description?: string;
  descriptionTestId?: string;
  actions: ActionSheetAction[];
  cancelLabel: string;
  rootTestId?: string;
  cancelTestId?: string;
}

export class ActionSheetController implements IDisposable {
  static create(options: ActionSheetOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.actionSheet,
      zIndex.dialog,
      (initOptions) =>
        instantiationService.createInstance(ActionSheetController, options, initOptions),
    );
  }

  readonly zIndex: number;
  readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: ActionSheetOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get title(): string | undefined {
    return this.options.title;
  }

  get description(): string | undefined {
    return this.options.description;
  }

  get descriptionTestId(): string | undefined {
    return this.options.descriptionTestId;
  }

  get actions(): ActionSheetAction[] {
    return this.options.actions;
  }

  get cancelLabel(): string {
    return this.options.cancelLabel;
  }

  get rootTestId(): string | undefined {
    return this.options.rootTestId;
  }

  get cancelTestId(): string | undefined {
    return this.options.cancelTestId;
  }

  async run(action: ActionSheetAction): Promise<void> {
    if (action.disabled) return;
    try {
      await action.run();
    } finally {
      if (!action.keepOpen) this.dispose();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
