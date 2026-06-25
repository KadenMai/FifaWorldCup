import { useMemo } from 'react';
import type { Match, Standing, Team } from '../types';
import { useT } from '../context/LanguageContext';
import GoogleGroupTable from './GoogleGroupTable';
import { buildFormMap } from '../utils/standingsHelpers';

interface GoogleStandingsProps {
  standings: Standing[];
  teams: Team[];
  groups: string[];
  matches: Match[];
}

export default function GoogleStandings({
  standings,
  teams,
  groups,
  matches,
}: GoogleStandingsProps) {
  const t = useT();

  const formMap = useMemo(() => {
    const ids = teams.map((t) => t.id);
    return buildFormMap(ids, matches);
  }, [teams, matches]);

  return (
    <div className="g-standings-full">
      <div className="g-standings-groups-grid">
        {groups.map((g) => (
          <GoogleGroupTable
            key={g}
            group={g}
            standings={standings}
            teams={teams}
            matches={matches}
            formMap={formMap}
          />
        ))}
      </div>
      <div className="g-standings-legend">
        <span className="g-standings-legend-dot" />
        {t('standings.top2')}
        <span className="g-standings-legend-sep">·</span>
        <span className="g-form-dot g-form-w g-form-legend">✓</span> {t('standings.win')}
        <span className="g-form-dot g-form-d g-form-legend">−</span> {t('standings.draw')}
        <span className="g-form-dot g-form-l g-form-legend">✕</span> {t('standings.loss')}
      </div>
    </div>
  );
}
