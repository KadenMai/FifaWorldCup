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

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
