// 浏览器端附件 Blob 缓存模块。
// 用统一的 scope/key 保存附件 Blob，避免把二进制内容转成 base64 文本。
// 内存模式存放在进程内 Map；浏览器模式存放在 IndexedDB:
// database=islet-browser-attachment-blob-store, objectStore=blobs。
export {
  createBrowserAttachmentBlobStore,
  type BrowserAttachmentBlobStore,
  type BrowserAttachmentBlobUrlHandle,
} from './impl';
