import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Match, Stadium, Team } from '../types';
import { useLanguage } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import { resolveMatchTeams } from '../utils/bracketHelpers';
import {
  formatDate,
  formatMatchTime,
  formatStadiumLabel,
  getMatchWinner,
  getTeamById,
  translateMatchRound,
} from '../utils/helpers';

interface GoogleMatchRowProps {
  match: Match;
  teams: Team[];
  stadium?: Stadium;
  showMeta?: boolean;
  locale?: string;
  allMatches: Match[];
}

function teamDisplayName(
  teamId: string,
  teams: Team[],
  tbd: string
): string {
  if (!teamId) return tbd;
  return getTeamById(teams, teamId)?.name ?? teamId;
}

export default function GoogleMatchRow({
  match,
  teams,
  stadium,
  showMeta = true,
  locale,
  allMatches,
}: GoogleMatchRowProps) {
  const { locale: ctxLocale, t } = useLanguage();
  const loc = locale ?? ctxLocale;

  const { homeTeamId, awayTeamId } = resolveMatchTeams(match, teams, allMatches);
  const displayMatch = { ...match, homeTeamId, awayTeamId };

  const home = homeTeamId ? getTeamById(teams, homeTeamId) : undefined;
  const away = awayTeamId ? getTeamById(teams, awayTeamId) : undefined;
  const winner = getMatchWinner(displayMatch, teams);
  const isLive = match.status === 'Live';
  const isFinished = match.status === 'Finished';
  const isScheduled = match.status === 'Scheduled';
  const tbd = t('bracket.tbd');

  const statusLabel = t(`match.status.${match.status}`);
  const roundLabel = translateMatchRound(t, match.round);

  const kickoffTime = formatMatchTime(match.date, match.time, match.timezone, loc);

  const scoreDisplay = isScheduled
    ? 'vs'
    : `${match.homeScore ?? '-'} - ${match.awayScore ?? '-'}`;

  return (
    <Link to={`/matches/${match.id}`} className="g-match-row g-match-row-readable">
      <div className="g-match-row-top">
        <span className="g-match-round">
          {roundLabel}
          {match.group ? ` · ${t('common.group')} ${match.group}` : ''}
        </span>
        <span className={`g-match-status ${isLive ? 'live' : isFinished ? 'finished' : 'scheduled'}`}>
          {isLive && <span className="g-live-dot" />}
          {statusLabel}
        </span>
      </div>

      <div className="g-match-kickoff">
        <span className="g-match-kickoff-time">{kickoffTime}</span>
      </div>

      <div className="g-match-teams-line">
        <span className={`g-match-team-inline home${winner?.id === home?.id ? ' winner' : ''}`}>
          {home ? <TeamFlag team={home} size={22} /> : <span className="g-bracket-tbd-icon" aria-hidden />}
          <span className="g-match-team-name">{teamDisplayName(homeTeamId, teams, tbd)}</span>
        </span>

        <span
          className={`g-match-score-inline${isLive ? ' live' : ''}${isScheduled ? ' scheduled' : ''}`}
        >
          {scoreDisplay}
        </span>

        <span className={`g-match-team-inline away${winner?.id === away?.id ? ' winner' : ''}`}>
          <span className="g-match-team-name">{teamDisplayName(awayTeamId, teams, tbd)}</span>
          {away ? <TeamFlag team={away} size={22} /> : <span className="g-bracket-tbd-icon" aria-hidden />}
        </span>
      </div>

      {showMeta && stadium && (
        <div className="g-match-meta">
          {formatStadiumLabel(stadium)}
        </div>
      )}
    </Link>
  );
}

export function GoogleMatchDateGroup({
  date,
  matches,
  teams,
  stadiums,
  locale,
  initialExpanded,
  allMatches,
}: {
  date: string;
  matches: Match[];
  teams: Team[];
  stadiums: Stadium[];
  locale?: string;
  initialExpanded?: boolean;
  allMatches: Match[];
}) {
  const { locale: ctxLocale, t } = useLanguage();
  const loc = locale ?? ctxLocale;

  const [expanded, setExpanded] = useState(initialExpanded ?? false);

  useEffect(() => {
    setExpanded(initialExpanded ?? false);
  }, [initialExpanded, date]);

  const liveCount = matches.filter((m) => m.status === 'Live').length;

  return (
    <div className={`g-match-date-group${expanded ? '' : ' is-collapsed'}`}>
      <button
        type="button"
        className="g-match-date-header"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span className="g-match-date-label">{formatDate(date, loc)}</span>
        {!expanded && (
          <span className="g-match-date-summary">
            {t('match.todayCount', { count: matches.length })}
            {liveCount > 0 && (
              <>
                {' · '}
                {t('hub.liveNow', { count: liveCount })}
              </>
            )}
          </span>
        )}
        <span className={`g-match-date-chevron${expanded ? ' is-open' : ''}`} aria-hidden>
          ›
        </span>
      </button>
      {expanded &&
        matches.map((match) => {
          const stadium = stadiums.find((s) => s.id === match.stadiumId);
          return (
            <GoogleMatchRow
              key={match.id}
              match={match}
              teams={teams}
              stadium={stadium}
              locale={loc}
              allMatches={allMatches}
            />
          );
        })}
    </div>
  );
}

export function GoogleMatchPastSection({
  days,
  teams,
  stadiums,
  locale,
  allMatches,
}: {
  days: [string, Match[]][];
  teams: Team[];
  stadiums: Stadium[];
  locale?: string;
  allMatches: Match[];
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (days.length === 0) return null;

  const matchCount = days.reduce((total, [, dayMatches]) => total + dayMatches.length, 0);

  return (
    <div className="g-match-past-section">
      <button
        type="button"
        className="g-match-past-header"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span className="g-match-past-title">{t('match.playedSection')}</span>
        {!expanded && (
          <span className="g-match-date-summary">
            {t('match.todayCount', { count: matchCount })}
          </span>
        )}
        <span className={`g-match-date-chevron${expanded ? ' is-open' : ''}`} aria-hidden>
          ›
        </span>
      </button>
      {expanded &&
        days.map(([date, dateMatches]) => (
          <GoogleMatchDateGroup
            key={date}
            date={date}
            matches={dateMatches}
            teams={teams}
            stadiums={stadiums}
            locale={locale}
            initialExpanded={false}
            allMatches={allMatches}
          />
        ))}
    </div>
  );
}
