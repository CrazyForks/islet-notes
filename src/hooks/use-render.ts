import { useCallback, useState } from 'react';

export function useRender() {
  const [, setVersion] = useState(0);
  return useCallback(() => setVersion((value) => value + 1), []);
}
