import type { Standing, Team } from '../types';
import { useT } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import { getTeamById, sortStandings } from '../utils/helpers';

interface StandingsTableProps {
  standings: Standing[];
  teams: Team[];
  group?: string;
}

export default function StandingsTable({ standings, teams, group }: StandingsTableProps) {
  const t = useT();
  const filtered = group
    ? standings.filter((s) => s.group === group)
    : standings;

  const sorted = sortStandings(filtered, teams);

  if (sorted.length === 0) {
    return <p className="empty-state">{t('standings.noData')}</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{t('standings.team')}</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>{t('standings.gd')}</th>
            <th>{t('standings.pts')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const team = getTeamById(teams, row.teamId);
            return (
              <tr key={`${row.group}-${row.teamId}`} className={idx < 2 ? 'pos-qualify' : ''}>
                <td>{idx + 1}</td>
                <td>
                  <div className="team-cell">
                    <TeamFlag team={team} size={20} />
                    <span>{team?.shortName ?? row.teamId}</span>
                  </div>
                </td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td><strong>{row.points}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
