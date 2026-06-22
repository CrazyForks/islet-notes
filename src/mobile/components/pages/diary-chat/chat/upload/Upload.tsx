import { AttachmentUploadTaskRecord } from '@/services/fileAsset/common/uploadTaskStore';
import React from 'react';
import { UploadAudioMessage } from '../audio/UploadAudio';
import { UploadImageMessage } from './UploadImageMessage';

interface UploadMessageProps {
  task: AttachmentUploadTaskRecord;
}

export function UploadMessage({ task }: UploadMessageProps) {
  if (task.type === 'audio') return <UploadAudioMessage task={task} />;
  return <UploadImageMessage task={task} />;
}
