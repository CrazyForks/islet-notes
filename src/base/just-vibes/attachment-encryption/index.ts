// 附件与数据库快照加密模块。
// 统一维护恢复密钥派生、快照加解密、附件二进制加解密的跨端格式。
export {
  decryptAttachmentBlob,
  decryptDatabaseSnapshot,
  deriveRecoveryKeyHash,
  encryptAttachmentBlob,
  encryptAttachmentBytesForTest,
  encryptDatabaseSnapshot,
  type AttachmentEncryptionTestVectorOptions,
} from './impl';
