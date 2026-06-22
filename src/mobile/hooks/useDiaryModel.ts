import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { IDiaryService } from '@/services/diary/common/diaryService';

export function useDiaryModel() {
  const diaryService = useService(IDiaryService);
  useWatchEvent(diaryService.onStateChange);
  return diaryService.modelState;
}
