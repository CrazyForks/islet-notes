// 浏览器端 Host 文件系统模块。
// 用统一接口封装内存和 IndexedDB 两种实现，提供应用数据目录风格的文本文件读写能力。
// 内存模式存放在进程内 Set/Map；浏览器模式存放在 IndexedDB:
// database=islet-browser-host-filesystem, objectStore=directories/files。
export {
  createBrowserHostFilesystem,
  createIndexedDbHostFilesystem,
  createMemoryHostFilesystem,
  type BrowserHostFilesystem,
} from './impl';
