import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadAllData, type AppData } from '../data/dataLoader';

interface DataContextValue {
  data: AppData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue>({
  data: null,
  loading: true,
  error: null,
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

  return (
    <DataContext.Provider value={{ data, loading, error }}>
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
