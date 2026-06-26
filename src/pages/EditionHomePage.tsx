import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { fetchSiteConfig } from '../api/siteConfig';
import { loadEditionCatalog, type EditionSummary } from '../data/dataLoader';
import { useT } from '../context/LanguageContext';
import { editionPath } from '../utils/editionPaths';
import { LoadingState } from '../components/PageState';

export default function EditionHomePage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [editions, setEditions] = useState<EditionSummary[]>([]);
  const [defaultEdition, setDefaultEdition] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchSiteConfig(), loadEditionCatalog()])
      .then(([config, catalog]) => {
        setDefaultEdition(config.defaultEdition);
        setEditions(catalog.editions);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) {
    return <div className="container error-state">{error}</div>;
  }

  if (defaultEdition) {
    const target = editions.find((e) => e.id === defaultEdition && e.available);
    if (target) {
      return <Navigate to={editionPath(defaultEdition)} replace />;
    }
  }

  return (
    <div className="container edition-picker">
      <h1 className="page-title">{t('editions.title')}</h1>
      <p className="page-subtitle">{t('editions.subtitle')}</p>

      <div className="edition-grid">
        {editions.map((edition) =>
          edition.available ? (
            <Link key={edition.id} to={editionPath(edition.id)} className="edition-card edition-card-active">
              <div className="edition-card-year">{edition.id}</div>
              <div className="edition-card-name">{edition.name}</div>
              <div className="edition-card-hosts">{edition.hosts}</div>
            </Link>
          ) : (
            <div key={edition.id} className="edition-card edition-card-soon" aria-disabled>
              <div className="edition-card-year">{edition.id}</div>
              <div className="edition-card-name">{edition.name}</div>
              <div className="edition-card-hosts">{edition.hosts}</div>
              <div className="edition-card-badge">{t('editions.comingSoon')}</div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
