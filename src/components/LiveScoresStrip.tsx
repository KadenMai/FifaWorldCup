import { Link } from 'react-router-dom';
import type { Match, Team } from '../types';
import TeamFlag from './TeamFlag';
import { getTeamById } from '../utils/helpers';

interface LiveScoresStripProps {
  matches: Match[];
  teams: Team[];
}

export default function LiveScoresStrip({ matches, teams }: LiveScoresStripProps) {
  const liveMatches = matches.filter((m) => m.status === 'Live');

  if (liveMatches.length === 0) return null;

  return (
    <div className="g-live-strip">
      {liveMatches.map((match) => {
        const home = getTeamById(teams, match.homeTeamId);
        const away = getTeamById(teams, match.awayTeamId);
        return (
          <Link key={match.id} to={`/matches/${match.id}`} className="g-live-pill">
            <span className="g-live-dot" />
            <TeamFlag team={home} size={18} />
            <span>{home?.shortName}</span>
            <span className="g-live-pill-score">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </span>
            <span>{away?.shortName}</span>
            <TeamFlag team={away} size={18} />
          </Link>
        );
      })}
    </div>
  );
}
