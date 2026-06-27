import { Link } from 'react-router-dom';
import type { Match, Stadium, Team } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useEditionPath } from '../context/EditionContext';
import TeamFlag from './TeamFlag';
import { resolveMatchTeams } from '../utils/bracketHelpers';
import {
  formatDate,
  formatMatchTime,
  formatStadiumLabel,
  getMatchWinner,
  getTeamById,
} from '../utils/helpers';

interface MatchCardProps {
  match: Match;
  teams: Team[];
  allMatches?: Match[];
  stadium?: Stadium;
}

export default function MatchCard({ match, teams, allMatches, stadium }: MatchCardProps) {
  const { locale, t } = useLanguage();
  const editionPath = useEditionPath();
  const { homeTeamId, awayTeamId } = allMatches
    ? resolveMatchTeams(match, teams, allMatches)
    : { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId };
  const displayMatch = { ...match, homeTeamId, awayTeamId };
  const home = getTeamById(teams, homeTeamId);
  const away = getTeamById(teams, awayTeamId);
  const winner = getMatchWinner(displayMatch, teams);
  const homeScore = displayMatch.homeScore ?? '-';
  const awayScore = displayMatch.awayScore ?? '-';
  const statusLabel = t(`match.status.${displayMatch.status}`);

  const statusClass =
    displayMatch.status === 'Live'
      ? 'badge-live'
      : displayMatch.status === 'Finished'
        ? 'badge-finished'
        : 'badge-scheduled';

  return (
    <Link to={editionPath(`/matches/${match.id}`)} className="card match-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className={`badge ${statusClass}`}>{statusLabel}</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {formatDate(displayMatch.date, locale)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <TeamFlag team={home} size={32} />
          <div style={{ fontWeight: winner?.id === home?.id ? 700 : 500, marginTop: 4 }}>
            {home?.shortName ?? homeTeamId}
          </div>
        </div>
        <div style={{
          fontSize: displayMatch.status === 'Live' ? '1.75rem' : '1.5rem',
          fontWeight: 700,
          color: displayMatch.status === 'Live' ? 'var(--color-live)' : 'inherit',
          minWidth: 80,
          textAlign: 'center',
        }}>
          {homeScore} - {awayScore}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <TeamFlag team={away} size={32} />
          <div style={{ fontWeight: winner?.id === away?.id ? 700 : 500, marginTop: 4 }}>
            {away?.shortName ?? awayTeamId}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        <span>{formatMatchTime(displayMatch.date, displayMatch.time, displayMatch.timezone, locale)} · </span>
        {displayMatch.group && <span>{t('common.group')} {displayMatch.group} · </span>}
        {stadium && <span>{formatStadiumLabel(stadium)}</span>}
      </div>
    </Link>
  );
}
