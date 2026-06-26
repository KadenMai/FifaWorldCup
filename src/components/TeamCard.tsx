import { Link } from 'react-router-dom';
import type { Coach, Match, Team } from '../types';
import { useEditionPath } from '../context/EditionContext';
import { useT } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import { countTeamMatches } from '../utils/helpers';

interface TeamCardProps {
  team: Team;
  coach?: Coach;
  matches: Match[];
}

export default function TeamCard({ team, coach, matches }: TeamCardProps) {
  const matchCount = countTeamMatches(team.id, matches);
  const t = useT();
  const editionPath = useEditionPath();

  return (
    <Link to={editionPath(`/teams/${team.id}`)} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TeamFlag team={team} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{team.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {team.group && `${t('common.group')} ${team.group}`}
            {team.confederation && ` · ${team.confederation}`}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{coach?.name ?? t('teams.coachTbd')}</span>
        <span>{t('teams.matches', { count: matchCount })}</span>
      </div>
      {team.fifaRanking && (
        <div style={{ marginTop: 8, fontSize: '0.75rem' }}>
          {t('teams.fifaRanking', { rank: team.fifaRanking })}
        </div>
      )}
    </Link>
  );
}
