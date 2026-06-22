import { zIndex } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { ITestInjectionService } from '@/services/e2e/common/testInjectionService';
import { IHostService } from '@/services/native/common/hostService';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { Emitter } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { VoiceRecorderEngine, type VoiceRecordingResult } from './voiceRecorderEngine';

const MIN_DURATION_SECONDS = 0.5;
const MAX_DURATION_SECONDS = 59;
const HIT_PADDING = 20;

export type VoiceFinishMode = 'send' | 'cancel';

type AnchorRect = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>;

export interface VoiceRecordingOptions {
  onSend: (result: VoiceRecordingResult) => void;
  onError: (message: string) => void;
  /** 录音结束(发送/取消/超时)后回调,供按钮恢复初始态。 */
  onClose?: () => void;
  anchorRect: AnchorRect;
}

/**
 * 录音会话控制器:持有录音引擎与状态机(启动/取消/发送、超时自动发送、上滑取消、
 * 切后台取消),并作为一个受 WorkbenchOverlayService 管理的 overlay 展示弹窗。
 * 按钮只负责把指针事件转发进来,其余逻辑都在这里。
 */
export class VoiceRecordingController implements IDisposable {
  static create(options: VoiceRecordingOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.voiceRecording,
      zIndex.voiceRecording,
      (initOptions) =>
        instantiationService.createInstance(VoiceRecordingController, options, initOptions),
    );
  }

  private readonly _onStatusChange = new Emitter<void>();
  readonly onStatusChange = this._onStatusChange.event;
  readonly zIndex: number;
  readonly instanceId: string;

  private readonly engine: VoiceRecorderEngine;
  private _finishMode: VoiceFinishMode = 'send';
  private finished = false;
  private disposed = false;
  private closed = false;
  private readonly handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.hidden) void this.finish(false);
  };

  constructor(
    private readonly options: VoiceRecordingOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
    @IHostService private readonly hostService: IHostService,
    @ITestInjectionService testInjectionService: ITestInjectionService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
    this.engine = new VoiceRecorderEngine(testInjectionService);
    this.engine.onChange(() => {
      if (!this.finished && this.engine.recording && this.engine.elapsed >= MAX_DURATION_SECONDS) {
        void this.finish(true, true);
        return;
      }
      this._onStatusChange.fire();
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    void this.begin();
  }

  get recording(): boolean {
    return this.engine.recording;
  }

  get elapsed(): number {
    return this.engine.elapsed;
  }

  get levels(): readonly number[] {
    return this.engine.levels;
  }

  get finishMode(): VoiceFinishMode {
    return this._finishMode;
  }

  get willCancel(): boolean {
    return this._finishMode === 'cancel';
  }

  get remaining(): number {
    return Math.max(0, MAX_DURATION_SECONDS - this.engine.elapsed);
  }

  get countdown(): number {
    return Math.min(MAX_DURATION_SECONDS, Math.ceil(this.remaining));
  }

  get showCountdown(): boolean {
    return !this.willCancel && this.remaining <= 10;
  }

  // 手指在按钮区域内松手即发送,移出按钮(上滑)则取消。
  updatePointer(clientX: number, clientY: number): void {
    if (this.finished) return;
    const rect = this.options.anchorRect;
    const inside =
      clientX >= rect.left - HIT_PADDING &&
      clientX <= rect.right + HIT_PADDING &&
      clientY >= rect.top - HIT_PADDING &&
      clientY <= rect.bottom + HIT_PADDING;
    const next: VoiceFinishMode = inside ? 'send' : 'cancel';
    if (next !== this._finishMode) {
      this._finishMode = next;
      this.hostService.vibrateShort();
      this._onStatusChange.fire();
    }
  }

  /** 松手:在按钮上发送,在取消区取消。 */
  release(): void {
    void this.finish(true);
  }

  /** 指针被系统取消等异常情况:直接取消。 */
  abort(): void {
    void this.finish(false);
  }

  private async begin(): Promise<void> {
    try {
      await this.engine.start();
      if (this.disposed || this.finished) this.engine.cancel();
    } catch {
      this.options.onError(
        localize(
          'diary.voice.permissionDenied',
          'Microphone access is unavailable. Check permissions and try again.',
        ),
      );
      this.dispose();
    }
  }

  // forceSend 用于时长到顶自动结束:无论手指是否停在取消区,都直接发送。
  private async finish(send: boolean, forceSend = false): Promise<void> {
    if (this.finished) return;
    this.finished = true;
    const cancelZone = this._finishMode === 'cancel';
    const wasRecording = this.engine.recording;
    this.removeVisibilityListener();
    // 立即收起弹窗,后续上传/识别在后台进行。
    this.workbenchOverlayService.removeOverlay(this.instanceId);
    try {
      if (!send || (!forceSend && cancelZone)) {
        this.engine.cancel();
        return;
      }
      if (!wasRecording) {
        this.engine.cancel();
        this.options.onError(
          localize('diary.voice.tooShort', 'Recording is too short. Hold and speak again.'),
        );
        return;
      }
      try {
        const result = await this.engine.stop();
        if (result.duration < MIN_DURATION_SECONDS) {
          this.options.onError(
            localize('diary.voice.tooShort', 'Recording is too short. Hold and speak again.'),
          );
          return;
        }
        this.options.onSend({
          ...result,
          duration: Math.min(result.duration, MAX_DURATION_SECONDS),
        });
      } catch (error) {
        this.options.onError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      this.engine.dispose();
      this.notifyClose();
    }
  }

  private notifyClose(): void {
    if (this.closed) return;
    this.closed = true;
    this.options.onClose?.();
  }

  private removeVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.finished = true;
    this.removeVisibilityListener();
    this.engine.dispose();
    this.workbenchOverlayService.removeOverlay(this.instanceId);
    this.notifyClose();
  }
}
