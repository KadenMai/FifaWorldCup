import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Match, Stadium, Team } from '../types';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import MatchScoreModal from './MatchScoreModal';
import TeamFlag from './TeamFlag';
import {
  formatDate,
  formatMatchTime,
  getMatchWinner,
  getTeamById,
  shouldExpandMatchDay,
} from '../utils/helpers';

interface GoogleMatchRowProps {
  match: Match;
  teams: Team[];
  stadium?: Stadium;
  showMeta?: boolean;
  locale?: string;
}

export default function GoogleMatchRow({
  match,
  teams,
  stadium,
  showMeta = true,
  locale,
}: GoogleMatchRowProps) {
  const navigate = useNavigate();
  const { applyScoreUpdate } = useData();
  const { locale: ctxLocale, t } = useLanguage();
  const loc = locale ?? ctxLocale;
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  const home = getTeamById(teams, match.homeTeamId);
  const away = getTeamById(teams, match.awayTeamId);
  const winner = getMatchWinner(match, teams);
  const isLive = match.status === 'Live';
  const isFinished = match.status === 'Finished';
  const isScheduled = match.status === 'Scheduled';

  const statusLabel = t(`match.status.${match.status}`);
  const roundLabel =
    match.round === 'Group Stage'
      ? t('match.round.Group Stage')
      : match.round;

  const kickoffTime = formatMatchTime(match.date, match.time, match.timezone, loc);

  const scoreDisplay = isScheduled
    ? 'vs'
    : `${match.homeScore ?? '-'} - ${match.awayScore ?? '-'}`;

  return (
    <>
      <div
        className="g-match-row g-match-row-readable"
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/matches/${match.id}`)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigate(`/matches/${match.id}`);
          }
        }}
      >
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
          <span className="g-match-kickoff-label">{t('match.kickoff')}</span>
          <span className="g-match-kickoff-time">{kickoffTime}</span>
        </div>

        <div className="g-match-teams-line">
          <span className={`g-match-team-inline home${winner?.id === home?.id ? ' winner' : ''}`}>
            <TeamFlag team={home} size={22} />
            <span className="g-match-team-name">{home?.name ?? match.homeTeamId}</span>
          </span>

          <button
            type="button"
            className={`g-match-score-inline g-match-score-btn${isLive ? ' live' : ''}${isScheduled ? ' scheduled' : ''}`}
            title={t('admin.tapToUpdate')}
            aria-label={t('admin.tapToUpdate')}
            onClick={(event) => {
              event.stopPropagation();
              setScoreModalOpen(true);
            }}
          >
            {scoreDisplay}
          </button>

          <span className={`g-match-team-inline away${winner?.id === away?.id ? ' winner' : ''}`}>
            <span className="g-match-team-name">{away?.name ?? match.awayTeamId}</span>
            <TeamFlag team={away} size={22} />
          </span>
        </div>

        {showMeta && stadium && (
          <div className="g-match-meta">
            {stadium.name} · {stadium.city}
          </div>
        )}
      </div>

      <MatchScoreModal
        match={match}
        home={home}
        away={away}
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        onSaved={applyScoreUpdate}
      />
    </>
  );
}

export function GoogleMatchDateGroup({
  date,
  matches,
  teams,
  stadiums,
  locale,
  initialExpanded,
}: {
  date: string;
  matches: Match[];
  teams: Team[];
  stadiums: Stadium[];
  locale?: string;
  initialExpanded?: boolean;
}) {
  const { locale: ctxLocale, t } = useLanguage();
  const loc = locale ?? ctxLocale;

  const defaultExpanded = useMemo(
    () => initialExpanded ?? shouldExpandMatchDay(matches),
    [initialExpanded, matches]
  );
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

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
}: {
  days: [string, Match[]][];
  teams: Team[];
  stadiums: Stadium[];
  locale?: string;
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
          />
        ))}
    </div>
  );
}
