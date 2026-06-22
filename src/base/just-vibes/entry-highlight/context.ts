import { createContext } from 'react';

// 当前被高亮的条目 id;为空表示没有任何条目处于高亮态。
export const EntryHighlightContext = createContext<string | undefined>(undefined);
