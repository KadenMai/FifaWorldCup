import type { Match, Team } from '../../types';
import GoogleKnockoutBracket from '../GoogleKnockoutBracket';

interface KnockoutBracketProps {
  matches: Match[];
  teams: Team[];
}

export default function KnockoutBracket({ matches, teams }: KnockoutBracketProps) {
  return <GoogleKnockoutBracket matches={matches} teams={teams} />;
}
