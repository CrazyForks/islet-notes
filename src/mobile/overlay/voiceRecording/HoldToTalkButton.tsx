import { useWatchEvent } from '@/hooks/use-watch-event';
import { cx, styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import React, { useRef, useState } from 'react';
import { useVoiceRecording } from './useVoiceRecording';
import type { VoiceRecordingController } from './VoiceRecordingController';
import type { VoiceRecordingResult } from './voiceRecorderEngine';

interface HoldToTalkButtonProps {
  onSend: (result: VoiceRecordingResult) => void;
  onError: (message: string) => void;
}

/**
 * 录音按钮:只负责把按住/移动/松手手势转发给 VoiceRecordingController,
 * 录音状态、弹窗、发送/取消逻辑全部在 controller(overlay)里。
 */
export function HoldToTalkButton({ onSend, onError }: HoldToTalkButtonProps) {
  const startRecording = useVoiceRecording();
  const [controller, setController] = useState<VoiceRecordingController | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  useWatchEvent(controller?.onStatusChange);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (controller || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    const session = startRecording({
      anchorRect: rect,
      onSend,
      onError,
      onClose: () => {
        pointerIdRef.current = null;
        setController(null);
      },
    });
    setController(session);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    controller?.updatePointer(event.clientX, event.clientY);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    if (event.type === 'pointerup') controller?.release();
    else controller?.abort();
  };

  const holding = !!controller;
  const willCancel = controller?.willCancel ?? false;
  const preparing = holding && !controller?.recording;

  return (
    <button
      className={cx(
        styles.VoiceRecording.HoldButton,
        holding ? styles.VoiceRecording.HoldButtonActive : styles.VoiceRecording.HoldButtonIdle,
      )}
      type='button'
      data-test-id={DiaryChat.holdToTalk}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      {preparing ? (
        <span className={styles.VoiceRecording.HoldButtonContent}>
          <span>{localize('diary.voice.preparing', 'Preparing')}</span>
          <span className={styles.VoiceRecording.HoldPreparingDots} aria-hidden='true'>
            <i className={styles.VoiceRecording.HoldPreparingDot} />
            <i
              className={styles.VoiceRecording.HoldPreparingDot}
              style={{ animationDelay: '0.18s' }}
            />
            <i
              className={styles.VoiceRecording.HoldPreparingDot}
              style={{ animationDelay: '0.36s' }}
            />
          </span>
        </span>
      ) : holding ? (
        willCancel ? (
          localize('diary.voice.releaseToCancel', 'Release to cancel')
        ) : (
          localize('diary.voice.releaseToSend', 'Release to send')
        )
      ) : (
        localize('diary.voice.holdToTalk', 'Hold to talk')
      )}
    </button>
  );
}
