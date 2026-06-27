import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useT } from '../context/LanguageContext';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import StadiumCard from '../components/StadiumCard';
import StadiumMap from '../components/d3/StadiumMap';
import { ErrorState, LoadingState } from '../components/PageState';

export default function StadiumsPage() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const t = useT();

  const stadiums = data?.stadiums ?? [];
  const matches = data?.matches ?? [];

  const countries = useMemo(
    () => ['all', ...Array.from(new Set(stadiums.map((s) => s.country))).sort()],
    [stadiums],
  );

  const countryTabs = useMemo(
    () =>
      countries.map((c) => ({
        id: c,
        label: c === 'all' ? t('common.allCountries') : c,
      })),
    [countries, t],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const filtered = stadiums.filter((stadium) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      stadium.name.toLowerCase().includes(q) ||
      stadium.city.toLowerCase().includes(q) ||
      stadium.country.toLowerCase().includes(q);
    const matchesCountry = countryFilter === 'all' || stadium.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="container">
      <h1 className="page-title">{t('stadiums.title')}</h1>
      <p className="page-subtitle">
        {t('stadiums.subtitle', { count: filtered.length })}
      </p>

      <StadiumMap stadiums={stadiums} />

      <SearchBar value={search} onChange={setSearch} placeholder={t('stadiums.searchPlaceholder')} sticky />
      <FilterTabs tabs={countryTabs} active={countryFilter} onChange={setCountryFilter} />

      <div className="card-grid">
        {filtered.map((stadium) => (
          <StadiumCard key={stadium.id} stadium={stadium} matches={matches} />
        ))}
      </div>
    </div>
  );
}
