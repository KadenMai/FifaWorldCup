import { Link } from 'react-router-dom';
import type { Match, Standing, Team } from '../types';
import { useEditionPath } from '../context/EditionContext';
import { useT } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import { FORM_MATCH_COUNT, type TeamFormData } from '../utils/standingsHelpers';
import { getMergedGroupStandings, getTeamById } from '../utils/helpers';

interface GoogleGroupTableProps {
  group: string;
  standings: Standing[];
  teams: Team[];
  matches: Match[];
  formMap: Map<string, TeamFormData>;
  confirmedKnockout: Set<string>;
}

function FormDots({ form, label }: { form: (string | null)[]; label: string }) {
  return (
    <div className="g-form-dots" aria-label={label}>
      {form.map((r, i) => (
        <span
          key={i}
          className={`g-form-dot${r ? ` g-form-${r.toLowerCase()}` : ' g-form-empty'}`}
          title={r ?? ''}
        >
          {r === 'W' && '✓'}
          {r === 'L' && '✕'}
          {r === 'D' && '−'}
        </span>
      ))}
    </div>
  );
}

export default function GoogleGroupTable({
  group,
  standings,
  teams,
  matches,
  formMap,
  confirmedKnockout,
}: GoogleGroupTableProps) {
  const t = useT();
  const editionPath = useEditionPath();
  const rows = getMergedGroupStandings(group, standings, teams, matches);

  if (rows.length === 0) return null;

  return (
    <div className="g-group-table-wrap">
      <h3 className="g-group-table-title">
        {t('standings.tableGroup', { group })}
        <span className="g-group-table-count">({rows.length})</span>
      </h3>
      <div className="g-group-table-scroll">
        <table className="g-group-table">
          <thead>
            <tr>
              <th className="g-col-rank">#</th>
              <th className="g-col-team">{t('standings.team')}</th>
              <th className="g-col-num">{t('standings.won')}</th>
              <th className="g-col-num">{t('standings.drawn')}</th>
              <th className="g-col-num">{t('standings.lost')}</th>
              <th className="g-col-num">{t('standings.gd')}</th>
              <th className="g-col-pts">{t('standings.pts')}</th>
              <th className="g-col-form">{t('standings.results')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const team = getTeamById(teams, row.teamId);
              const form = formMap.get(row.teamId);
              const isConfirmed = confirmedKnockout.has(row.teamId);

              return (
                <tr key={row.teamId} className={isConfirmed ? 'g-row-qualified' : ''}>
                  <td className="g-col-rank">{idx + 1}</td>
                  <td className="g-col-team">
                    <Link to={editionPath(`/teams/${row.teamId}`)} className="g-team-link">
                      {isConfirmed && (
                        <span
                          className="g-knockout-crown"
                          title={t('standings.knockoutConfirmed')}
                          aria-label={t('standings.knockoutConfirmed')}
                        >
                          👑
                        </span>
                      )}
                      <TeamFlag team={team} size={20} />
                      <span>{team?.name ?? row.teamId}</span>
                    </Link>
                  </td>
                  <td className="g-col-num">{row.won}</td>
                  <td className="g-col-num">{row.drawn}</td>
                  <td className="g-col-num">{row.lost}</td>
                  <td className="g-col-num">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="g-col-pts"><strong>{row.points}</strong></td>
                  <td className="g-col-form">
                    <FormDots
                      form={form?.form ?? Array(FORM_MATCH_COUNT).fill(null)}
                      label={t('standings.results')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
