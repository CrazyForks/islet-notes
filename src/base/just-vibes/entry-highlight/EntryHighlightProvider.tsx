import React, { type ReactNode } from 'react';
import { EntryHighlightContext } from './context';

export function EntryHighlightProvider({
  highlightedEntryId,
  children,
}: {
  highlightedEntryId: string | undefined;
  children: ReactNode;
}) {
  return (
    <EntryHighlightContext.Provider value={highlightedEntryId}>
      {children}
    </EntryHighlightContext.Provider>
  );
}
