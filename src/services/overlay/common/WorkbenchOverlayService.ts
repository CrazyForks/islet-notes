import { Emitter, Event } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { generateUuid } from 'vscf/base/common/uuid';
import { createDecorator } from 'vscf/platform/instantiation/common';

export type OverlayType =
  | 'image-preview'
  | 'video-preview'
  | 'video-player'
  | 'dialog'
  | 'toast'
  | 'top-tips'
  | 'menu';

export interface OverlayInitOptions {
  type: OverlayType;
  instanceId: string;
  zIndex: number;
}

export interface IWorkbenchOverlayService {
  readonly _serviceBrand: undefined;
  readonly onOverlayChange: Event<void>;
  getOverlay<T>(id: string): T | null;
  createOverlay<T extends IDisposable>(
    type: OverlayType,
    overlayId: string,
    zIndex: number,
    creator: (options: OverlayInitOptions) => T,
  ): T;
  removeOverlayById(overlayId: string): void;
  removeOverlay(instanceId: string): void;
}

export class WorkbenchOverlayService implements IWorkbenchOverlayService {
  readonly _serviceBrand: undefined;
  private readonly overlays = new Map<string, IDisposable & { instanceId?: string }>();
  private readonly _onOverlayChange = new Emitter<void>();
  readonly onOverlayChange = this._onOverlayChange.event;

  getOverlay<T>(id: string): T | null {
    return (this.overlays.get(id) as T | undefined) ?? null;
  }

  createOverlay<T extends IDisposable>(
    type: OverlayType,
    overlayId: string,
    zIndex: number,
    creator: (options: OverlayInitOptions) => T,
  ): T {
    const instanceId = generateUuid();
    const oldOverlay = this.overlays.get(overlayId);
    oldOverlay?.dispose();

    const overlay = creator({ type, instanceId, zIndex });
    this.overlays.set(overlayId, Object.assign(overlay, { instanceId }));
    this._onOverlayChange.fire();
    return overlay;
  }

  removeOverlayById(overlayId: string): void {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return;
    this.overlays.delete(overlayId);
    this._onOverlayChange.fire();
    overlay.dispose();
  }

  removeOverlay(instanceId: string): void {
    const overlayId = Array.from(this.overlays.keys()).find(
      (key) => this.overlays.get(key)?.instanceId === instanceId,
    );
    if (!overlayId) return;
    this.overlays.delete(overlayId);
    this._onOverlayChange.fire();
  }
}

export const IWorkbenchOverlayService = createDecorator<IWorkbenchOverlayService>(
  'IWorkbenchOverlayService',
);
