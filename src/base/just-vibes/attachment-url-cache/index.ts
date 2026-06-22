// 附件 URL 缓存模块。
// 按附件用途维护内存里的 object URL LRU，调用方不关心 revoke 时机。
export {
  createAttachmentUrlCache,
  type AttachmentUrlCache,
  type AttachmentUrlCacheRole,
} from './impl';
