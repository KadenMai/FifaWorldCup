import { Link } from 'react-router-dom';
import type { Match, Team } from '../types';
import { useEditionPath } from '../context/EditionContext';
import { useT } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import FormDots, { FORM_MATCH_COUNT } from './FormDots';
import { getTeamById } from '../utils/helpers';
import { areAllGroupsComplete } from '../utils/groupStageHelpers';
import { getThirdPlaceCandidates, isThirdPlaceKnockoutConfirmed } from '../utils/thirdPlaceRanking';
import type { TeamFormData } from '../utils/standingsHelpers';

interface GoogleThirdPlaceTableProps {
  teams: Team[];
  matches: Match[];
  formMap: Map<string, TeamFormData>;
}

export default function GoogleThirdPlaceTable({ teams, matches, formMap }: GoogleThirdPlaceTableProps) {
  const t = useT();
  const editionPath = useEditionPath();
  const groupMatches = matches.filter((m) => m.group);
  const ranked = getThirdPlaceCandidates(teams, groupMatches);
  const allGroupsDone = areAllGroupsComplete(teams, groupMatches);

  if (ranked.length === 0) return null;

  return (
    <div className="g-third-place-section">
      <div className="g-group-table-wrap g-third-place-table-wrap">
        <h3 className="g-group-table-title">{t('standings.thirdPlaceTitle')}</h3>
        <p className="g-third-place-subtitle">
          {allGroupsDone ? t('standings.thirdPlaceFinal') : t('standings.thirdPlaceLive')}
        </p>
        <div className="g-group-table-scroll">
          <table className="g-group-table">
            <thead>
              <tr>
                <th className="g-col-rank">#</th>
                <th className="g-col-group">{t('common.group')}</th>
                <th className="g-col-team">{t('standings.team')}</th>
                <th className="g-col-num">{t('standings.gd')}</th>
                <th className="g-col-pts">{t('standings.pts')}</th>
                <th className="g-col-form">{t('standings.results')}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, idx) => {
                const team = getTeamById(teams, row.teamId);
                const inTop8 = idx < 8;
                const showCrown = inTop8 && isThirdPlaceKnockoutConfirmed(row);

                return (
                  <tr
                    key={row.group}
                    className={inTop8 ? 'g-row-qualified g-row-third-advance' : 'g-row-third-out'}
                  >
                    <td className="g-col-rank">{idx + 1}</td>
                    <td className="g-col-group">{row.group}</td>
                    <td className="g-col-team">
                      <Link to={editionPath(`/teams/${row.teamId}`)} className="g-team-link">
                        {showCrown && (
                          <span
                            className="g-knockout-crown"
                            title={t('standings.thirdPlaceAdvances')}
                            aria-label={t('standings.thirdPlaceAdvances')}
                          >
                            👑
                          </span>
                        )}
                        <TeamFlag team={team} size={20} />
                        <span>{team?.name ?? row.teamId}</span>
                        {row.gamesRemaining > 0 && (
                          <span
                            className="g-third-place-pending"
                            title={t('standings.thirdPlaceAssumed', { count: row.gamesRemaining })}
                          >
                            *
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="g-col-num">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="g-col-pts">
                      <strong>{row.points}</strong>
                    </td>
                    <td className="g-col-form">
                      <FormDots
                        form={formMap.get(row.teamId)?.form ?? Array(FORM_MATCH_COUNT).fill(null)}
                        label={t('standings.results')}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="g-third-place-footnote">{t('standings.thirdPlaceTiebreak')}</p>
      </div>
    </div>
  );
}
