import { localize } from '@/nls';
import { DiaryChat } from '@/mobile/test.id';
import { cx, styles, zIndex } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import {
  ImagePickSource,
  IHostService,
  type HostVideoPick,
} from '@/services/native/common/hostService';
import { ITrackService } from '@/services/track/common/trackService';
import { useVideoPreview } from '@/mobile/overlay/videoPreview/useVideoPreview';
import { HoldToTalkButton } from '@/mobile/overlay/voiceRecording/HoldToTalkButton';
import {
  isVoiceRecordingSupported,
  type VoiceRecordingResult,
} from '@/mobile/overlay/voiceRecording/voiceRecorderEngine';
import { Camera, CirclePlus, Image as ImageIcon, Keyboard, Mic, Video } from 'lucide-react';
import React, { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';

const TEXTAREA_MIN_HEIGHT = 36;
const TEXTAREA_MAX_HEIGHT = 116;

// 从封面 data URL 读取自然宽高，用于转码前未知尺寸时的占位比例。
function readImageDimsFromUrl(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

interface DiaryChatFooterProps {
  notebookId: string;
}

export const DiaryChatFooter = forwardRef<HTMLElement, DiaryChatFooterProps>(
  function DiaryChatFooter({ notebookId }, ref) {
    const diaryService = useService(IDiaryService);
    const fileAssetService = useService(IFileAssetService);
    const hostService = useService(IHostService);
    const trackService = useService(ITrackService);
    const showToast = useSuccessToast();
    const showVideoPreview = useVideoPreview();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState('');
    const [voiceMode, setVoiceMode] = useState(false);
    const [plusOpen, setPlusOpen] = useState(false);
    const [error, setError] = useState('');
    const hasText = text.trim().length > 0 && !voiceMode;
    const voiceSupported = useMemo(() => isVoiceRecordingSupported(), []);
    const videoSupported = useMemo(() => hostService.caniuse('videoUpload'), [hostService]);

    useLayoutEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = 'auto';
      const nextHeight = Math.max(
        TEXTAREA_MIN_HEIGHT,
        Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT),
      );
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    }, [text]);

    const sendText = () => {
      const content = text.trim();
      if (!content || voiceMode) return;
      diaryService.addTextEntry(notebookId, content);
      setText('');
      setPlusOpen(false);
    };

    const showVoiceError = (message: string) => {
      showToast({ message, icon: 'none' });
    };

    // 切到语音模式不请求麦克风权限,等按下录音时再请求。
    const toggleVoiceMode = () => {
      if (voiceMode) {
        setVoiceMode(false);
        return;
      }
      setPlusOpen(false);
      textareaRef.current?.blur();
      setError('');
      setVoiceMode(true);
    };

    const sendVoice = async (result: VoiceRecordingResult) => {
      // 只负责上传;识别在上传落库后由 committer 触发。
      try {
        setError('');
        await fileAssetService.uploadAudioAttachment({
          notebookId,
          file: result.blob,
          duration: Math.round(result.duration * 10) / 10,
        });
      } catch (event) {
        showVoiceError(event instanceof Error ? event.message : String(event));
      }
    };

    const uploadImage = async (file: Blob) => {
      await fileAssetService.uploadImageAttachment({ notebookId, file });
    };

    const getVideoCacheScope = () => fileAssetService.getStorageScope();

    // 拍照：系统相机拍照模式，照片直接进日记。
    const takePhoto = async () => {
      try {
        setError('');
        setPlusOpen(false);
        const file = await hostService.pickImageBlob(ImagePickSource.Camera);
        if (file) await uploadImage(file);
      } catch (event) {
        const message = event instanceof Error ? event.message : String(event);
        setError(message);
      }
    };

    // 相册：Android 上可选照片或视频；照片直接进日记，视频弹预览半屏。
    const pickFromAlbum = async () => {
      try {
        setError('');
        setPlusOpen(false);
        if (!videoSupported) {
          const file = await hostService.pickImageBlob(ImagePickSource.Photos);
          if (file) await uploadImage(file);
          return;
        }
        const media = await hostService.pickMediaFromGallery({ cacheScope: getVideoCacheScope() });
        if (!media) return;
        if (media.kind === 'image') {
          await uploadImage(media.blob);
          return;
        }
        openVideoPreview(media.video);
      } catch (event) {
        const message = event instanceof Error ? event.message : String(event);
        setError(message);
      }
    };

    // 拍视频：系统相机录像模式，录完弹预览半屏。
    const startRecordVideo = async () => {
      try {
        setError('');
        setPlusOpen(false);
        const video = await hostService.recordVideo({ cacheScope: getVideoCacheScope() });
        if (video) openVideoPreview(video);
      } catch (event) {
        const message = event instanceof Error ? event.message : String(event);
        setError(message);
      }
    };

    // 弹出视频预览 overlay（选是否原画质）；确定后进入后台处理。
    const openVideoPreview = (video: HostVideoPick) => {
      showVideoPreview({
        video,
        onConfirm: (originalQuality) => void confirmVideo(video, originalQuality),
        onCancel: () =>
          void hostService
            .cleanVideoRecord({ sourcePath: video.sourcePath, cacheScope: getVideoCacheScope() })
            .catch(() => undefined),
      });
    };

    // 确定：半屏关闭，视频进日记标“处理中”，转码与上传走后台。
    const confirmVideo = async (video: HostVideoPick, originalQuality: boolean) => {
      try {
        // 优先用封面的自然宽高：系统返回的 resolution 可能未计旋转（竖屏报成横屏），
        // 而封面是按显示方向出的，比例才正确，能修正“处理中”占位比例。
        let width = video.width;
        let height = video.height;
        if (video.thumbnail) {
          const dims = await readImageDimsFromUrl(video.thumbnail);
          if (dims.width && dims.height) {
            width = dims.width;
            height = dims.height;
          }
        }
        // 是否“已够小可跳过转码”由原生按真实分辨率判断；这里只传用户是否勾了原画质。
        await fileAssetService.uploadVideoAttachment({
          notebookId,
          sourcePath: video.sourcePath,
          originalQuality,
          size: video.size,
          mimeType: video.mimeType,
          width,
          height,
          durationMs: video.durationMs,
          previewThumbnail: video.thumbnail,
        });
      } catch (event) {
        await hostService
          .cleanVideoRecord({ sourcePath: video.sourcePath, cacheScope: getVideoCacheScope() })
          .catch(() => undefined);
        const message = event instanceof Error ? event.message : String(event);
        setError(message);
      }
    };

    return (
      <footer
        ref={ref}
        className={styles.DiaryChatFooter.Root}
        data-test-id={DiaryChat.inputWrap}
        style={{ zIndex: zIndex.chatFooter }}
      >
        {error && (
          <div
            className={cx(styles.Text.Error, styles.DiaryChatFooter.InputErrorGap)}
            data-test-id={DiaryChat.inputError}
          >
            {error}
          </div>
        )}
        <div className={styles.DiaryChatFooter.InputRow}>
          {voiceSupported && (
            <button
              className={styles.DiaryChatFooter.PlusButton}
              type='button'
              data-test-id={DiaryChat.voiceToggle}
              title={
                voiceMode
                  ? localize('diary.voice.switchToKeyboard', 'Switch to keyboard')
                  : localize('diary.voice.switchToVoice', 'Switch to voice input')
              }
              aria-label={
                voiceMode
                  ? localize('diary.voice.switchToKeyboard', 'Switch to keyboard')
                  : localize('diary.voice.switchToVoice', 'Switch to voice input')
              }
              onClick={() => void toggleVoiceMode()}
            >
              {voiceMode ? (
                <Keyboard size={26} strokeWidth={1.6} />
              ) : (
                <Mic size={26} strokeWidth={1.6} />
              )}
            </button>
          )}
          {voiceMode ? (
            <HoldToTalkButton
              onSend={(result) => void sendVoice(result)}
              onError={showVoiceError}
            />
          ) : (
            <div className={styles.DiaryChatFooter.TextareaWrap}>
              <textarea
                ref={textareaRef}
                className={styles.DiaryChatFooter.Textarea}
                data-test-id={DiaryChat.input}
                value={text}
                rows={1}
                placeholder={localize('diary.inputPlaceholder', 'Write something...')}
                onFocus={() => setPlusOpen(false)}
                onChange={(event) => {
                  setText(event.target.value);
                  if (event.target.value.trim()) {
                    setPlusOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendText();
                  }
                }}
              />
            </div>
          )}
          <button
            className={
              hasText
                ? cx(styles.Button.Send, styles.DiaryChatFooter.SendSize)
                : styles.DiaryChatFooter.PlusButton
            }
            type='button'
            data-test-id={hasText ? DiaryChat.send : DiaryChat.more}
            title={hasText ? localize('common.send', 'Send') : 'More'}
            aria-label={hasText ? localize('common.send', 'Send') : 'More'}
            onPointerDown={(event) => {
              if (hasText) {
                event.preventDefault();
              }
            }}
            onClick={() => {
              if (hasText) {
                sendText();
                return;
              }
              if (!plusOpen) {
                textareaRef.current?.blur();
              }
              setPlusOpen(!plusOpen);
            }}
          >
            {hasText ? localize('common.send', 'Send') : <CirclePlus size={30} strokeWidth={1.6} />}
          </button>
        </div>
        {plusOpen && (
          <div className={styles.DiaryChatFooter.PlusPanel} data-test-id={DiaryChat.plusPanel}>
            <button
              className={styles.DiaryChatFooter.PlusAction}
              type='button'
              data-test-id={DiaryChat.album}
              onClick={() => {
                trackService.trackEvent('diary_chat_album_click');
                void pickFromAlbum();
              }}
            >
              <span className={styles.DiaryChatFooter.PlusTile}>
                <ImageIcon size={28} strokeWidth={1.3} />
              </span>
              <span className={styles.DiaryChatFooter.PlusLabel}>
                {localize('diary.album', 'Album')}
              </span>
            </button>
            <button
              className={styles.DiaryChatFooter.PlusAction}
              type='button'
              data-test-id={DiaryChat.camera}
              onClick={() => {
                trackService.trackEvent('diary_chat_camera_click');
                void takePhoto();
              }}
            >
              <span className={styles.DiaryChatFooter.PlusTile}>
                <Camera size={28} strokeWidth={1.3} />
              </span>
              <span className={styles.DiaryChatFooter.PlusLabel}>
                {localize('diary.camera', 'Camera')}
              </span>
            </button>
            {videoSupported && (
              <button
                className={styles.DiaryChatFooter.PlusAction}
                type='button'
                data-test-id={DiaryChat.video}
                onClick={() => {
                  trackService.trackEvent('diary_chat_video_click');
                  void startRecordVideo();
                }}
              >
                <span className={styles.DiaryChatFooter.PlusTile}>
                  <Video size={28} strokeWidth={1.3} />
                </span>
                <span className={styles.DiaryChatFooter.PlusLabel}>
                  {localize('diary.recordVideo', 'Record video')}
                </span>
              </button>
            )}
          </div>
        )}
      </footer>
    );
  },
);
