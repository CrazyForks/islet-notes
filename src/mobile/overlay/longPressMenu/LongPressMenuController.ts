import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import type { LucideIcon } from 'lucide-react';
import { Emitter } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface LongPressMenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  keepOpen?: boolean;
  run: () => void | Promise<void>;
}

export interface LongPressMenuOptions {
  anchorRect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>;
  actions: LongPressMenuAction[];
}

export class LongPressMenuController implements IDisposable {
  static create(options: LongPressMenuOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'menu',
      OverlayEnum.longPressMenu,
      zIndex.menu,
      (initOptions) =>
        instantiationService.createInstance(LongPressMenuController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: LongPressMenuOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get anchorRect(): Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'> {
    return this.options.anchorRect;
  }

  get actions(): LongPressMenuAction[] {
    return this.options.actions;
  }

  async run(action: LongPressMenuAction): Promise<void> {
    if (action.disabled) return;
    await action.run();
    if (!action.keepOpen) this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
