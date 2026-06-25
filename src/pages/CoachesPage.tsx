import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useT } from '../context/LanguageContext';
import SearchBar from '../components/SearchBar';
import CoachCard from '../components/CoachCard';
import { ErrorState, LoadingState } from '../components/PageState';
import { getTeamById } from '../utils/helpers';

export default function CoachesPage() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const t = useT();

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const { teams, coaches } = data;

  const filtered = coaches.filter((coach) => {
    if (!search) return true;
    const team = getTeamById(teams, coach.teamId);
    const q = search.toLowerCase();
    return (
      coach.name.toLowerCase().includes(q) ||
      team?.name.toLowerCase().includes(q) ||
      coach.nationality?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      <h1 className="page-title">{t('coaches.title')}</h1>
      <p className="page-subtitle">{t('coaches.count', { count: filtered.length })}</p>

      <SearchBar value={search} onChange={setSearch} placeholder={t('coaches.searchPlaceholder')} sticky />

      <div className="card-grid">
        {filtered.map((coach) => (
          <CoachCard key={coach.id} coach={coach} teams={teams} />
        ))}
      </div>
    </div>
  );
}
