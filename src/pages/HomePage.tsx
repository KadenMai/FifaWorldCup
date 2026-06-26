import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useEditionPath } from '../context/EditionContext';
import { useT } from '../context/LanguageContext';
import WorldCupHub from '../components/WorldCupHub';
import SearchBar from '../components/SearchBar';
import TeamFlag from '../components/TeamFlag';
import { ErrorState, LoadingState } from '../components/PageState';
import { useState } from 'react';

export default function HomePage() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const t = useT();
  const editionPath = useEditionPath();

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const { teams } = data;
  const searchLower = search.toLowerCase();
  const filteredTeams = search
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.shortName.toLowerCase().includes(searchLower) ||
          t.group?.toLowerCase().includes(searchLower)
      )
    : [];

  return (
    <div className="container">
      <WorldCupHub data={data} />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t('teams.searchPlaceholder')}
      />

      {search && filteredTeams.length > 0 && (
        <div className="g-panel">
          <div className="g-panel-header">
            <div className="g-panel-title">{t('nav.teams')}</div>
          </div>
          {filteredTeams.slice(0, 8).map((team) => (
            <Link
              key={team.id}
              to={editionPath(`/teams/${team.id}`)}
              className="g-match-row"
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <TeamFlag team={team} size={28} />
              <div>
                <div style={{ fontWeight: 500 }}>{team.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--google-text-secondary)' }}>
                  {t('common.group')} {team.group}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
