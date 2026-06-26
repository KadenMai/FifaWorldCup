import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadAllData, setRuntimeDataVersion, type AppData } from '../data/dataLoader';
import type { Match, Standing } from '../types';

interface ScoreUpdateResult {
  match: Match;
  standings: Standing[];
  dataVersion?: string;
}

interface DataContextValue {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  applyScoreUpdate: (result: ScoreUpdateResult) => void;
}

const DataContext = createContext<DataContextValue>({
  data: null,
  loading: true,
  error: null,
  applyScoreUpdate: () => {},
});

export function DataProvider({
  edition,
  children,
}: {
  edition: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadAllData(edition)
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [edition]);

  const applyScoreUpdate = useCallback((result: ScoreUpdateResult) => {
    if (result.dataVersion) {
      setRuntimeDataVersion(result.dataVersion);
    }
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map((match) =>
          match.id === result.match.id ? { ...match, ...result.match } : match
        ),
        standings: result.standings,
        meta: result.dataVersion
          ? { ...prev.meta, dataVersion: result.dataVersion }
          : prev.meta,
      };
    });
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error, applyScoreUpdate }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}

export function useRequireData(): AppData {
  const { data, loading, error } = useData();
  if (loading) throw new Promise(() => {});
  if (error || !data) throw new Error(error ?? 'Failed to load data');
  return data;
}
