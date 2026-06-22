import { registerPlugin } from '@capacitor/core';

interface NativeImageToolsPlugin {
  generateThumbnail(options: {
    imageBase64: string;
    minDimension: number;
    quality: number;
  }): Promise<{
    imageBase64: string;
    mimeType: string;
  }>;
}

export const NativeImageTools = registerPlugin<NativeImageToolsPlugin>('ImageTools');
