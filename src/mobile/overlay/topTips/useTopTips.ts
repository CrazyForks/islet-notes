import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { TopTipsController, TopTipsOptions } from './TopTipsController';

export function useTopTips() {
  const instantiationService = useService(IInstantiationService);
  return (options: TopTipsOptions) => TopTipsController.create(options, instantiationService);
}
