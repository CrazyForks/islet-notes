import './style.css';

export const EntryHighlight = {
  // 覆盖层贴合所在块的圆角(border-radius: inherit),闪烁淡出动画见 style.css。
  Overlay: 'islet-entry-highlight',
  // 复刻气泡尖角,让尾巴与气泡主体一起变色。
  OverlayTail: 'islet-entry-highlight-tail',
} as const;
