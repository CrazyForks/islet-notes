// @islet-import-scope same-dir

export interface ObjectStoragePutOptions {
  contentType?: string;
  contentLength?: number;
}

export interface ObjectStorageGetOptions {
  expiresIn?: number;
  signingDate?: Date;
  responseCacheControl?: string;
}

export interface ObjectStorageObjectMetadata {
  eTag?: string;
  lastModified?: Date;
  contentLength?: number;
}

export interface ObjectStorageDownloadRequest {
  url: string;
  method?: 'GET';
  headers?: Record<string, string>;
}

export interface ObjectStorageHostRequestOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  /** base64 编码的请求体。 */
  body?: string;
}

export interface ObjectStorageHostResponse {
  status: number;
  /** base64 编码的响应体。 */
  body: string;
}

export interface ObjectStorageHostBridge {
  caniuse(feature: 'webDavHttpRequest'): boolean;
  request(options: ObjectStorageHostRequestOptions): Promise<ObjectStorageHostResponse | undefined>;
}

export interface ObjectStorage {
  putObject(
    key: string,
    body: Blob | Uint8Array | string,
    options?: ObjectStoragePutOptions,
  ): Promise<void>;
  headObject(key: string): Promise<ObjectStorageObjectMetadata | undefined>;
  getObjectBytes(key: string, options?: ObjectStorageGetOptions): Promise<Uint8Array | undefined>;
  getObjectBlob(key: string, options?: ObjectStorageGetOptions): Promise<Blob | undefined>;
}
