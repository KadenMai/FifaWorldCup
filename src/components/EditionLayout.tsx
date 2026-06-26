import { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { EditionProvider } from '../context/EditionContext';
import { DataProvider } from '../context/DataContext';
import Header, { BottomNav } from '../components/Header';
import { loadEditionCatalog, loadEditionMeta, type EditionMeta } from '../data/dataLoader';
import { isEditionId } from '../utils/editionPaths';
import { LoadingState } from '../components/PageState';

export default function EditionLayout() {
  const { edition } = useParams<{ edition: string }>();
  const [meta, setMeta] = useState<EditionMeta | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditionId(edition)) {
      setAllowed(false);
      return;
    }

    let cancelled = false;
    setMeta(null);
    setAllowed(null);
    setError(null);

    loadEditionCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const entry = catalog.editions.find((e) => e.id === edition);
        if (!entry?.available) {
          setAllowed(false);
          return;
        }
        return loadEditionMeta(edition).then((loadedMeta) => {
          if (cancelled) return;
          setMeta(loadedMeta);
          setAllowed(true);
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [edition]);

  if (!isEditionId(edition) || allowed === false) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return <div className="container error-state">{error}</div>;
  }

  if (!meta || allowed !== true) {
    return <LoadingState />;
  }

  return (
    <EditionProvider edition={edition} meta={meta}>
      <DataProvider edition={edition}>
        <Header />
        <main>
          <Outlet />
        </main>
        <BottomNav />
      </DataProvider>
    </EditionProvider>
  );
}
