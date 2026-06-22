import { useContext } from 'react';
import { EntryHighlightContext } from './context';

export function useIsEntryHighlighted(entryId: string): boolean {
  return useContext(EntryHighlightContext) === entryId;
}
