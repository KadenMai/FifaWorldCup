import { useMemo } from 'react';
import type { Match, Standing, Team } from '../types';
import { useT } from '../context/LanguageContext';
import GoogleGroupTable from './GoogleGroupTable';
import GoogleThirdPlaceTable from './GoogleThirdPlaceTable';
import { buildFormMap } from '../utils/standingsHelpers';
import { getConfirmedKnockoutTeamIds } from '../utils/groupStageHelpers';

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

  const confirmedKnockout = useMemo(
    () => getConfirmedKnockoutTeamIds(teams, matches),
    [teams, matches],
  );

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
            confirmedKnockout={confirmedKnockout}
          />
        ))}
      </div>
      <GoogleThirdPlaceTable teams={teams} matches={matches} formMap={formMap} />
      <div className="g-standings-legend">
        <span className="g-knockout-crown g-knockout-crown-legend" aria-hidden="true">
          👑
        </span>
        {t('standings.knockoutConfirmed')}
        <span className="g-standings-legend-sep">·</span>
        <span className="g-standings-legend-note">{t('standings.thirdPlaceLegend')}</span>
        <span className="g-standings-legend-sep">·</span>
        <span className="g-form-dot g-form-w g-form-legend">✓</span> {t('standings.win')}
        <span className="g-form-dot g-form-d g-form-legend">−</span> {t('standings.draw')}
        <span className="g-form-dot g-form-l g-form-legend">✕</span> {t('standings.loss')}
      </div>
    </div>
  );
}
