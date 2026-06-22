import Player from 'xgplayer';
import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  url: string;
  autoplay?: boolean;
}

const accentColor = 'var(--c-accent)';

// 西瓜视频开源播放器（xgplayer）封装，替换系统原生播放器，控件更美观。
export function VideoPlayer({ url, autoplay = true }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const player = new Player({
      el,
      url,
      autoplay,
      width: '100%',
      height: '100%',
      playsinline: true,
      commonStyle: {
        playedColor: accentColor,
        volumeColor: accentColor,
        sliderBtnStyle: {
          background: 'rgba(7, 193, 96, 0.3)',
          border: '0.5px solid rgba(7, 193, 96, 0.08)',
          boxShadow: '0 0 1px rgba(7, 193, 96, 0.55)',
        },
      },
      // 只保留 播放/进度条/时间，去掉 倍速、全屏、音量等按钮。
      ignores: [
        'fullscreen',
        'cssfullscreen',
        'playbackrate',
        'volume',
        'pip',
        'download',
        'definition',
        'screenshot',
        'miniscreen',
        'keyboard',
      ],
    });
    return () => {
      player.destroy();
    };
  }, [url, autoplay]);

  return <div ref={containerRef} className='islet-video-player h-full w-full' />;
}
