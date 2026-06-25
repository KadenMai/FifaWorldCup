import { Link } from 'react-router-dom';
import type { Match, Stadium, Team } from '../types';
import { useLanguage } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import {
  formatDate,
  formatMatchTime,
  getMatchWinner,
  getTeamById,
} from '../utils/helpers';

interface MatchCardProps {
  match: Match;
  teams: Team[];
  stadium?: Stadium;
}

export default function MatchCard({ match, teams, stadium }: MatchCardProps) {
  const { locale, t } = useLanguage();
  const home = getTeamById(teams, match.homeTeamId);
  const away = getTeamById(teams, match.awayTeamId);
  const winner = getMatchWinner(match, teams);
  const homeScore = match.homeScore ?? '-';
  const awayScore = match.awayScore ?? '-';
  const statusLabel = t(`match.status.${match.status}`);

  const statusClass =
    match.status === 'Live'
      ? 'badge-live'
      : match.status === 'Finished'
        ? 'badge-finished'
        : 'badge-scheduled';

  return (
    <Link to={`/matches/${match.id}`} className="card match-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className={`badge ${statusClass}`}>{statusLabel}</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {formatDate(match.date, locale)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <TeamFlag team={home} size={32} />
          <div style={{ fontWeight: winner?.id === home?.id ? 700 : 500, marginTop: 4 }}>
            {home?.shortName ?? match.homeTeamId}
          </div>
        </div>
        <div style={{
          fontSize: match.status === 'Live' ? '1.75rem' : '1.5rem',
          fontWeight: 700,
          color: match.status === 'Live' ? 'var(--color-live)' : 'inherit',
          minWidth: 80,
          textAlign: 'center',
        }}>
          {homeScore} - {awayScore}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <TeamFlag team={away} size={32} />
          <div style={{ fontWeight: winner?.id === away?.id ? 700 : 500, marginTop: 4 }}>
            {away?.shortName ?? match.awayTeamId}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        <span>{formatMatchTime(match.date, match.time, match.timezone, locale)} · </span>
        {match.group && <span>{t('common.group')} {match.group} · </span>}
        {stadium && <span>{stadium.name} · {stadium.city}</span>}
      </div>
    </Link>
  );
}
