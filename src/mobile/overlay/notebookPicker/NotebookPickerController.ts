import type { ImageAttachmentRecord } from '@/core/diary/type';
import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface NotebookPickerNotebook {
  id: string;
  name: string;
  coverAttachment?: ImageAttachmentRecord;
}

export interface NotebookPickerOptions {
  title: string;
  notebooks: NotebookPickerNotebook[];
  rootTestId?: string;
  searchTestId?: string;
  listTestId?: string;
  optionTestId?: string;
  closeTestId?: string;
  onSelect: (notebookId: string) => void | Promise<void>;
  onCancel?: () => void;
}

export class NotebookPickerController implements IDisposable {
  static create(options: NotebookPickerOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.notebookPicker,
      zIndex.dialog,
      (initOptions) =>
        instantiationService.createInstance(NotebookPickerController, options, initOptions),
    );
  }

  readonly zIndex: number;
  readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: NotebookPickerOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get title(): string {
    return this.options.title;
  }

  get notebooks(): NotebookPickerNotebook[] {
    return this.options.notebooks;
  }

  get rootTestId(): string | undefined {
    return this.options.rootTestId;
  }

  get searchTestId(): string | undefined {
    return this.options.searchTestId;
  }

  get listTestId(): string | undefined {
    return this.options.listTestId;
  }

  get optionTestId(): string | undefined {
    return this.options.optionTestId;
  }

  get closeTestId(): string | undefined {
    return this.options.closeTestId;
  }

  cancel(): void {
    this.options.onCancel?.();
    this.dispose();
  }

  select(notebookId: string): void {
    void Promise.resolve(this.options.onSelect(notebookId)).finally(() => this.dispose());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
