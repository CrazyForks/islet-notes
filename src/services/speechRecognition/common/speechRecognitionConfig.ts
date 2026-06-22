import { z } from 'zod';

export const SPEECH_RECOGNITION_CONFIG_KEY = 'speech-recognition';
export const SPEECH_RECOGNITION_CONFIG_SWR_KEY = 'speech-recognition-config';

export const SpeechRecognitionConfigSchema = z.object({
  provider: z.literal('baidu'),
  apiKey: z.string(),
  secretKey: z.string(),
  autoTranscribe: z.boolean().default(true),
});

export type BaiduSpeechRecognitionConfigRecord = z.infer<typeof SpeechRecognitionConfigSchema>;

export type SpeechRecognitionConfigRecord = BaiduSpeechRecognitionConfigRecord;

export type SpeechRecognitionCredentials = Pick<
  BaiduSpeechRecognitionConfigRecord,
  'apiKey' | 'secretKey'
>;
