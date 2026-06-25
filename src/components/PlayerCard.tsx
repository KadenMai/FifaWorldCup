import type { Player, Team } from '../types';
import { useT } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import { getTeamById } from '../utils/helpers';

function translatePosition(t: (key: string) => string, pos: string): string {
  const key = `positions.${pos}`;
  const result = t(key);
  return result === key ? pos : result;
}

interface PlayerCardProps {
  player: Player;
  teams: Team[];
}

export default function PlayerCard({ player, teams }: PlayerCardProps) {
  const team = getTeamById(teams, player.teamId);
  const t = useT();

  const positionLabel = player.position
    ? translatePosition(t, player.position)
    : undefined;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {player.shirtNumber != null && (
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            flexShrink: 0,
          }}>
            {player.shirtNumber}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600 }}>{player.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TeamFlag team={team} size={18} />
            <span>{team?.name} · {positionLabel}</span>
          </div>
          {player.club && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {player.club}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
