import type { AudioAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { useEffect, useRef, useState } from 'react';

let activeAudio: HTMLAudioElement | undefined;
let stopCurrentAudio: (() => void) | undefined;

function isActiveAudio(audio: HTMLAudioElement): boolean {
  return activeAudio === audio;
}

function stopActiveAudio(): void {
  stopCurrentAudio?.();
}

function playExclusiveAudio(audio: HTMLAudioElement, onStop: () => void): void {
  stopCurrentAudio?.();
  activeAudio = audio;
  stopCurrentAudio = () => {
    audio.pause();
    audio.currentTime = 0;
    activeAudio = undefined;
    stopCurrentAudio = undefined;
    onStop();
  };
  void audio.play().catch(() => stopCurrentAudio?.());
}

export function useAttachmentAudioPlayback(attachment: AudioAttachmentRecord) {
  const fileAssetService = useService(IFileAssetService);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>();
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      const audio = audioRef.current;
      if (audio && isActiveAudio(audio)) stopActiveAudio();
      audioRef.current = undefined;
    };
  }, [attachment.id]);

  const togglePlay = async () => {
    const current = audioRef.current;
    if (current && isActiveAudio(current)) {
      stopActiveAudio();
      return;
    }
    if (loading) return;
    try {
      setFailed(false);
      if (!attachment.s3Key) throw new Error('Audio is missing.');
      setLoading(true);
      // object URL 可能已被 attachment-url-cache 的 LRU 淘汰并 revoke，
      // 所以每次播放都重新 getFileUrl 取一个仍有效的 URL，而不是复用旧 Audio 上的。
      const url = await fileAssetService.getFileUrl(attachment.s3Key, { role: 'thumbnail' });
      if (!url) throw new Error('Failed to load audio.');
      if (disposedRef.current) return;
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      }
      if (audio.src !== url) audio.src = url;
      audio.onended = () => stopActiveAudio();
      audio.onerror = () => {
        setFailed(true);
        stopActiveAudio();
      };
      setPlaying(true);
      playExclusiveAudio(audio, () => {
        if (!disposedRef.current) setPlaying(false);
      });
    } catch {
      if (!disposedRef.current) setFailed(true);
    } finally {
      if (!disposedRef.current) setLoading(false);
    }
  };

  return { failed, loading, playing, togglePlay };
}
