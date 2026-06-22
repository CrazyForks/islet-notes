// @islet-import-scope same-dir

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { S3ConfigRecord } from '@/core/diary/type';
import { syncStoragePath } from '@/core/spec/syncStoragePath';
import type {
  ObjectStorage,
  ObjectStorageGetOptions,
  ObjectStorageObjectMetadata,
  ObjectStoragePutOptions,
} from './objectStorage';

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
}

export type S3ConnectionConfig = Omit<S3ConfigRecord, 'updatedAt'> | S3ConfigRecord;

export function createS3ObjectStorage(config: S3ConnectionConfig): ObjectStorage {
  return new S3ObjectStorage(config);
}

export async function testS3Connection(
  configInput: S3ConnectionConfig,
): Promise<TestConnectionResult> {
  const config = { ...configInput, updatedAt: Date.now() };
  try {
    const storage = createS3ObjectStorage(config);
    const key = syncStoragePath.remote.healthcheck(config);
    await storage.putObject(key, JSON.stringify({ ok: true, at: new Date().toISOString() }), {
      contentType: 'application/json',
    });
    await storage.getObjectBytes(key, { expiresIn: 60 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function createS3Client(config: S3ConnectionConfig): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly config: S3ConnectionConfig) {
    this.client = createS3Client(config);
  }

  async putObject(
    key: string,
    body: Blob | Uint8Array | string,
    options: ObjectStoragePutOptions = {},
  ): Promise<void> {
    const { contentType, contentLength } = options;
    if (!(body instanceof Blob)) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: contentLength,
        }),
      );
      return;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: new Uint8Array(await body.arrayBuffer()),
        ContentType: contentType,
        ContentLength: contentLength ?? body.size,
      }),
    );
  }

  async getObjectBytes(
    key: string,
    options?: ObjectStorageGetOptions,
  ): Promise<Uint8Array | undefined> {
    const blob = await this.getObjectBlob(key, options);
    return blob ? new Uint8Array(await blob.arrayBuffer()) : undefined;
  }

  async headObject(key: string): Promise<ObjectStorageObjectMetadata | undefined> {
    try {
      const output = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
      return {
        eTag: output.ETag,
        lastModified: output.LastModified,
        contentLength: output.ContentLength,
      };
    } catch (error) {
      if (isObjectNotFound(error)) return undefined;
      throw error;
    }
  }

  async getObjectBlob(
    key: string,
    options: ObjectStorageGetOptions = {},
  ): Promise<Blob | undefined> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ResponseCacheControl: options.responseCacheControl,
      }),
      {
        expiresIn: options.expiresIn ?? 60,
        signingDate: options.signingDate,
      },
    );
    const response = await fetch(url);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`GET ${key} failed with ${response.status}`);
    return response.blob();
  }
}

function isObjectNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    candidate.name === 'NotFound' ||
    candidate.name === 'NoSuchKey' ||
    candidate.$metadata?.httpStatusCode === 404
  );
}
