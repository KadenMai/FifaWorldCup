import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { EditionMeta } from '../data/dataLoader';
import { editionPath } from '../utils/editionPaths';

interface EditionContextValue {
  edition: string;
  meta: EditionMeta;
  path: (suffix?: string) => string;
}

const EditionContext = createContext<EditionContextValue | null>(null);

export function EditionProvider({
  edition,
  meta,
  children,
}: {
  edition: string;
  meta: EditionMeta;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      edition,
      meta,
      path: (suffix = '') => editionPath(edition, suffix),
    }),
    [edition, meta],
  );

  return <EditionContext.Provider value={value}>{children}</EditionContext.Provider>;
}

export function useEdition() {
  const ctx = useContext(EditionContext);
  if (!ctx) {
    throw new Error('useEdition must be used within EditionProvider');
  }
  return ctx;
}

export function useEditionPath() {
  return useEdition().path;
}
