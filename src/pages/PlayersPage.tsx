import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useT } from '../context/LanguageContext';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import PlayerCard from '../components/PlayerCard';
import { ErrorState, LoadingState } from '../components/PageState';
import { getTeamById } from '../utils/helpers';

function translatePosition(t: (key: string) => string, pos: string): string {
  const key = `positions.${pos}`;
  const result = t(key);
  return result === key ? pos : result;
}

export default function PlayersPage() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const t = useT();

  const teams = data?.teams ?? [];
  const players = data?.players ?? [];

  const teamTabs = useMemo(
    () => [
      { id: 'all', label: t('common.allTeams') },
      ...teams.map((tm) => ({ id: tm.id, label: tm.shortName })),
    ],
    [teams, t],
  );

  const positions = useMemo(
    () => ['all', ...Array.from(new Set(players.map((p) => p.position).filter(Boolean)))],
    [players],
  );

  const positionTabs = useMemo(
    () =>
      positions.map((p) => ({
        id: p as string,
        label: p === 'all' ? t('common.allPositions') : translatePosition(t, p as string),
      })),
    [positions, t],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const filtered = players.filter((player) => {
    const team = getTeamById(teams, player.teamId);
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      player.name.toLowerCase().includes(q) ||
      team?.name.toLowerCase().includes(q) ||
      player.position?.toLowerCase().includes(q);
    const matchesTeam = teamFilter === 'all' || player.teamId === teamFilter;
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  return (
    <div className="container">
      <h1 className="page-title">{t('players.title')}</h1>
      <p className="page-subtitle">{t('players.count', { count: filtered.length })}</p>

      <SearchBar value={search} onChange={setSearch} placeholder={t('players.searchPlaceholder')} sticky />
      <FilterTabs tabs={teamTabs.slice(0, 8)} active={teamFilter} onChange={setTeamFilter} />
      <FilterTabs tabs={positionTabs} active={positionFilter} onChange={setPositionFilter} />

      <div className="card-grid">
        {filtered.map((player) => (
          <PlayerCard key={player.id} player={player} teams={teams} />
        ))}
      </div>
    </div>
  );
}
