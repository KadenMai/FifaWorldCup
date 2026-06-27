import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useEditionPath } from '../context/EditionContext';
import { useLanguage, useT } from '../context/LanguageContext';
import GoogleSportsPanel from '../components/GoogleSportsPanel';
import MatchScoreModal from '../components/MatchScoreModal';
import { ErrorState, LoadingState } from '../components/PageState';
import TeamFlag from '../components/TeamFlag';
import { formatDate, formatMatchTime, getMatchWinner, getTeamById, translateMatchRound, formatStadiumLabel } from '../utils/helpers';
import { resolveMatchTeams } from '../utils/bracketHelpers';

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data, loading, error, applyScoreUpdate } = useData();
  const t = useT();
  const editionPath = useEditionPath();
  const { locale } = useLanguage();
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const { teams, matches, stadiums } = data;
  const rawMatch = matches.find((m) => m.id === matchId);

  if (!rawMatch) {
    return (
      <div className="container error-state">
        {t('match.notFound')}{' '}
        <Link to={editionPath('/')}>{t('common.backToMatches')}</Link>
      </div>
    );
  }

  const { homeTeamId, awayTeamId } = resolveMatchTeams(rawMatch, teams, matches);
  const match = { ...rawMatch, homeTeamId, awayTeamId };
  const home = homeTeamId ? getTeamById(teams, homeTeamId) : undefined;
  const away = awayTeamId ? getTeamById(teams, awayTeamId) : undefined;
  const tbd = t('bracket.tbd');
  const homeName = home?.name ?? tbd;
  const awayName = away?.name ?? tbd;
  const homeShort = home?.shortName ?? tbd;
  const awayShort = away?.shortName ?? tbd;
  const stadium = stadiums.find((s) => s.id === match.stadiumId);
  const winner = getMatchWinner(match, teams);
  const isLive = match.status === 'Live';

  const statusLabel = t(`match.status.${match.status}`);
  const roundLabel = translateMatchRound(t, match.round) || t('match.groupStage');

  const scoreDisplay =
    match.status === 'Scheduled'
      ? 'vs'
      : `${match.homeScore ?? '-'} - ${match.awayScore ?? '-'}`;

  return (
    <div className="container">
      <GoogleSportsPanel
        title={`${homeShort} vs ${awayShort}`}
        subtitle={roundLabel}
      >
        <div className="g-match-hero">
          <span
            className={`g-match-status ${isLive ? 'live' : ''}`}
            style={{ justifyContent: 'center', marginBottom: 8 }}
          >
            {isLive && <span className="g-live-dot" />}
            {statusLabel}
          </span>

          <div className="g-match-hero-scoreline">
            <div className="g-match-hero-team">
              <span className="g-match-hero-flag">
                {home ? <TeamFlag team={home} size={48} /> : <span className="g-bracket-tbd-icon" aria-hidden />}
              </span>
              <span className={`g-match-hero-name${winner?.id === home?.id ? ' winner' : ''}`}>
                {homeName}
              </span>
            </div>

            <div
              className={`g-match-hero-score${isLive ? ' live' : ''}`}
              style={isLive ? { color: 'var(--google-live)' } : undefined}
            >
              {scoreDisplay}
            </div>

            <div className="g-match-hero-team">
              <span className="g-match-hero-flag">
                {away ? <TeamFlag team={away} size={48} /> : <span className="g-bracket-tbd-icon" aria-hidden />}
              </span>
              <span className={`g-match-hero-name${winner?.id === away?.id ? ' winner' : ''}`}>
                {awayName}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="g-match-update-btn g-match-update-btn-hero"
            onClick={() => setScoreModalOpen(true)}
          >
            {t('admin.updateButton')}
          </button>

          {winner && (
            <p style={{ color: 'var(--google-blue)', fontWeight: 500, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <TeamFlag team={winner} size={20} />
              {t('match.wins', { team: winner.name })}
            </p>
          )}
        </div>

        <div className="g-info-list">
          <div className="g-info-row">
            <span className="g-info-label">{t('match.date')}</span>
            <span className="g-info-value">{formatDate(match.date, locale)}</span>
          </div>
          <div className="g-info-row">
            <span className="g-info-label">{t('match.kickoff')}</span>
            <span className="g-info-value">
              {formatMatchTime(match.date, match.time, match.timezone, locale)}
            </span>
          </div>
          {match.group && (
            <div className="g-info-row">
              <span className="g-info-label">{t('common.group')}</span>
              <span className="g-info-value">
                {t('common.group')} {match.group}
              </span>
            </div>
          )}
          {stadium && (
            <div className="g-info-row">
              <span className="g-info-label">{t('match.venue')}</span>
              <span className="g-info-value">
                {formatStadiumLabel(stadium)}
              </span>
            </div>
          )}
          {match.referee && (
            <div className="g-info-row">
              <span className="g-info-label">{t('match.referee')}</span>
              <span className="g-info-value">{match.referee}</span>
            </div>
          )}
        </div>
      </GoogleSportsPanel>

      <div className="g-panel" style={{ marginTop: 16 }}>
        <div className="g-panel-header">
          <div className="g-panel-title">{t('match.lineups')}</div>
        </div>
        <p style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--google-text-secondary)' }}>
          {t('match.lineupsSoon')}
        </p>
      </div>

      <MatchScoreModal
        match={match}
        home={home}
        away={away}
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        onSaved={applyScoreUpdate}
      />
    </div>
  );
}
