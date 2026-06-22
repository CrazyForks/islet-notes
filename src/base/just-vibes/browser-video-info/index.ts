// 浏览器端视频信息读取模块。
// 通过 video/canvas 原生能力读取视频尺寸、时长，并尽量生成预览缩略图。
export { readBrowserVideoInfo, type BrowserVideoInfo } from './impl';
