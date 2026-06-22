import { normalizeAndCheckMime } from '@/base/just-vibes/media-mime';
import type { ITestInjectionService } from '@/services/e2e/common/testInjectionService';
import { Emitter } from 'vscf/base/common/event';

export interface VoiceRecordingResult {
  blob: Blob;
  /** 秒。 */
  duration: number;
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
const LEVEL_BAR_COUNT = 30;
const LEVEL_SAMPLE_INTERVAL_MS = 90;

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

export function isVoiceRecordingSupported(): boolean {
  return !!navigator.mediaDevices?.getUserMedia && !!pickRecorderMimeType();
}

interface ActiveRecording {
  recorder: MediaRecorder;
  stream: MediaStream;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  chunks: Blob[];
  mimeType: string;
  startedAt: number;
}

/**
 * 录音引擎:封装 MediaRecorder/采样/电平计算,以命令式 API + onChange 事件暴露状态,
 * 不依赖 React,供录音 overlay 的 controller 持有。
 */
export class VoiceRecorderEngine {
  private readonly _onChange = new Emitter<void>();
  readonly onChange = this._onChange.event;

  private _recording = false;
  private _elapsed = 0;
  private _levels: number[] = Array(LEVEL_BAR_COUNT).fill(0);
  private active: ActiveRecording | undefined;
  private injectedRecording = false;
  private frame: number | undefined;

  constructor(private readonly testInjectionService?: ITestInjectionService) {}

  get recording(): boolean {
    return this._recording;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  get levels(): readonly number[] {
    return this._levels;
  }

  async start(): Promise<void> {
    if (this.active || this._recording) return;
    const injectedStart = await this.testInjectionService?.get<boolean>('voiceRecorder.start');
    if (injectedStart) {
      this.injectedRecording = true;
      this._recording = true;
      this._onChange.fire();
      return;
    }
    const mimeType = pickRecorderMimeType();
    if (!mimeType) throw new Error('Audio recording is not supported on this device.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const recorder = new MediaRecorder(stream, { mimeType });
    const active: ActiveRecording = {
      recorder,
      stream,
      audioContext,
      analyser,
      chunks: [],
      mimeType,
      startedAt: performance.now(),
    };
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) active.chunks.push(event.data);
    };
    recorder.start(250);
    this.active = active;
    this._recording = true;
    this._onChange.fire();

    const sample = new Uint8Array(analyser.frequencyBinCount);
    let lastLevelSampleAt = 0;
    const tick = () => {
      if (this.active !== active) return;
      const now = performance.now();
      if (now - lastLevelSampleAt >= LEVEL_SAMPLE_INTERVAL_MS) {
        lastLevelSampleAt = now;
        analyser.getByteTimeDomainData(sample);
        let peak = 0;
        for (const value of sample) {
          peak = Math.max(peak, Math.abs(value - 128) / 128);
        }
        this._levels = [...this._levels.slice(1), Math.min(1, peak * 1.6)];
        this._elapsed = (now - active.startedAt) / 1000;
        this._onChange.fire();
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  async stop(): Promise<VoiceRecordingResult> {
    if (this.injectedRecording) {
      this.injectedRecording = false;
      this._recording = false;
      this.resetMeter();
      const result =
        await this.testInjectionService?.get<VoiceRecordingResult>('voiceRecorder.stop');
      if (!result) throw new Error('Injected recording result is missing.');
      return result;
    }
    const active = this.active;
    if (!active) throw new Error('No active recording.');
    this._recording = false;
    return new Promise<VoiceRecordingResult>((resolve, reject) => {
      active.recorder.onstop = () => {
        const duration = (performance.now() - active.startedAt) / 1000;
        const blob = new Blob(active.chunks, {
          type: normalizeAndCheckMime('audio', active.mimeType),
        });
        if (blob.size === 0) reject(new Error('Recording produced no audio.'));
        else resolve({ blob, duration });
      };
      active.recorder.onerror = () => reject(new Error('Recording failed.'));
      active.recorder.stop();
    }).finally(() => {
      this.releaseActive();
      this.resetMeter();
    });
  }

  cancel(): void {
    if (this.injectedRecording) {
      this.injectedRecording = false;
      this._recording = false;
      void this.testInjectionService?.get('voiceRecorder.cancel');
      this.resetMeter();
      return;
    }
    const active = this.active;
    this._recording = false;
    if (!active) return;
    active.recorder.onstop = null;
    active.recorder.ondataavailable = null;
    try {
      active.recorder.stop();
    } catch {
      // Already inactive.
    }
    this.releaseActive();
    this.resetMeter();
  }

  dispose(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    const active = this.active;
    this.active = undefined;
    if (active) {
      try {
        active.recorder.stop();
      } catch {
        // Already inactive.
      }
      active.stream.getTracks().forEach((track) => track.stop());
      void active.audioContext.close().catch(() => undefined);
    }
  }

  private resetMeter(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this._elapsed = 0;
    this._levels = Array(LEVEL_BAR_COUNT).fill(0);
    this._onChange.fire();
  }

  private releaseActive(): void {
    const active = this.active;
    this.active = undefined;
    if (!active) return;
    active.stream.getTracks().forEach((track) => track.stop());
    void active.audioContext.close().catch(() => undefined);
  }
}
