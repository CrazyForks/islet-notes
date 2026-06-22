import { registerPlugin } from '@capacitor/core';

interface NativeWebDavHttpPlugin {
  request(options: {
    url: string;
    method: string;
    headers: Record<string, string>;
    /** base64 编码的请求体。 */
    body?: string;
  }): Promise<{
    status: number;
    /** base64 编码的响应体。 */
    body: string;
  }>;
}

export const NativeWebDavHttp = registerPlugin<NativeWebDavHttpPlugin>('WebDavHttp');
