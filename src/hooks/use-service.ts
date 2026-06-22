import { useContext } from 'react';
import { ServiceIdentifier } from 'vscf/platform/instantiation/common';
import { GlobalContext } from '@/base/browser/GlobalContext';

export function useService<T>(id: ServiceIdentifier<T>): T {
  const ctx = useContext(GlobalContext);
  if (!ctx) {
    throw new Error('GlobalContext is not available.');
  }
  return ctx.instantiationService.invokeFunction((accessor) => accessor.get(id));
}
