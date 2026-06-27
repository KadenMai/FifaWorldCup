import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useT } from '../context/LanguageContext';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import TeamCard from '../components/TeamCard';
import { ErrorState, LoadingState } from '../components/PageState';

export default function TeamsPage() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const t = useT();

  const teams = data?.teams ?? [];
  const coaches = data?.coaches ?? [];
  const matches = data?.matches ?? [];

  const groups = useMemo(
    () => ['all', ...Array.from(new Set(teams.map((tm) => tm.group).filter(Boolean))).sort()],
    [teams],
  );

  const groupTabs = useMemo(
    () =>
      groups.map((g) => ({
        id: g as string,
        label: g === 'all' ? t('common.allGroups') : `${t('common.group')} ${g}`,
      })),
    [groups, t],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const filtered = teams.filter((team) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      team.name.toLowerCase().includes(q) ||
      team.shortName.toLowerCase().includes(q) ||
      team.group?.toLowerCase().includes(q);
    const matchesGroup = groupFilter === 'all' || team.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="container">
      <h1 className="page-title">{t('teams.title')}</h1>
      <p className="page-subtitle">
        {t('teams.count', { filtered: filtered.length, total: teams.length })}
      </p>

      <SearchBar value={search} onChange={setSearch} placeholder={t('teams.searchPlaceholder')} sticky />
      <FilterTabs tabs={groupTabs} active={groupFilter} onChange={setGroupFilter} />

      <div className="card-grid">
        {filtered.map((team) => {
          const coach = coaches.find((c) => c.id === team.coachId);
          return (
            <TeamCard key={team.id} team={team} teams={teams} coach={coach} matches={matches} />
          );
        })}
      </div>
    </div>
  );
}
