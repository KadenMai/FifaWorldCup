import type { Coach, Team } from '../types';
import TeamFlag from './TeamFlag';
import { getTeamById } from '../utils/helpers';

interface CoachCardProps {
  coach: Coach;
  teams: Team[];
}

export default function CoachCard({ coach, teams }: CoachCardProps) {
  const team = getTeamById(teams, coach.teamId);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TeamFlag team={team} size={32} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{coach.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {team?.name}
          </div>
          {coach.nationality && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {coach.nationality}
            </div>
          )}
        </div>
      </div>
      {coach.notes && (
        <p style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {coach.notes}
        </p>
      )}
    </div>
  );
}
