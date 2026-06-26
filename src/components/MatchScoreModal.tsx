import { useEffect, useState } from 'react';
import type { Match, MatchStatus, Team } from '../types';
import { useEdition } from '../context/EditionContext';
import { useT } from '../context/LanguageContext';
import { submitMatchScore } from '../api/updateMatch';
import { getStoredAdminKey, storeAdminKey } from '../utils/adminAuth';
import TeamFlag from './TeamFlag';

interface MatchScoreModalProps {
  match: Match;
  home?: Team;
  away?: Team;
  open: boolean;
  onClose: () => void;
  onSaved: (result: { match: Match; standings: import('../types').Standing[]; dataVersion?: string }) => void;
}

const STATUSES: MatchStatus[] = ['Live', 'Finished', 'Scheduled'];

export default function MatchScoreModal({
  match,
  home,
  away,
  open,
  onClose,
  onSaved,
}: MatchScoreModalProps) {
  const t = useT();
  const { edition } = useEdition();
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [adminKey, setAdminKey] = useState('');
  const [rememberKey, setRememberKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHomeScore(match.homeScore !== null ? String(match.homeScore) : '');
    setAwayScore(match.awayScore !== null ? String(match.awayScore) : '');
    setStatus(match.status);
    setAdminKey(getStoredAdminKey());
    setError(null);
  }, [open, match]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const trimmedKey = adminKey.trim();
    if (!trimmedKey) {
      setError(t('admin.keyRequired'));
      setSaving(false);
      return;
    }

    const parsedHome = status === 'Scheduled' ? null : Number(homeScore);
    const parsedAway = status === 'Scheduled' ? null : Number(awayScore);

    if (status !== 'Scheduled' && (Number.isNaN(parsedHome) || Number.isNaN(parsedAway))) {
      setError(t('admin.scoreRequired'));
      setSaving(false);
      return;
    }

    try {
      const result = await submitMatchScore({
        edition,
        matchId: match.id,
        homeScore: parsedHome,
        awayScore: parsedAway,
        status,
        adminKey: trimmedKey,
      });

      storeAdminKey(trimmedKey, rememberKey);

      if (result.match && result.standings) {
        onSaved({
          match: result.match,
          standings: result.standings,
          dataVersion: result.dataVersion,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="g-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="g-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-score-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="match-score-modal-title" className="g-modal-title">
          {t('admin.updateScore')}
        </h2>

        <div className="g-modal-teams">
          <div className="g-modal-team">
            <TeamFlag team={home} size={28} />
            <span>{home?.name ?? match.homeTeamId}</span>
          </div>
          <span className="g-modal-vs">vs</span>
          <div className="g-modal-team">
            <TeamFlag team={away} size={28} />
            <span>{away?.name ?? match.awayTeamId}</span>
          </div>
        </div>

        <form className="g-modal-form" onSubmit={handleSubmit}>
          {status !== 'Scheduled' && (
            <div className="g-modal-scores">
              <label className="g-modal-field">
                <span>{home?.shortName ?? t('admin.home')}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={homeScore}
                  onChange={(event) => setHomeScore(event.target.value)}
                  required
                />
              </label>
              <span className="g-modal-score-sep">-</span>
              <label className="g-modal-field">
                <span>{away?.shortName ?? t('admin.away')}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={awayScore}
                  onChange={(event) => setAwayScore(event.target.value)}
                  required
                />
              </label>
            </div>
          )}

          <label className="g-modal-field g-modal-field-full">
            <span>{t('admin.status')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as MatchStatus)}>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`match.status.${value}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="g-modal-field g-modal-field-full">
            <span>{t('admin.apiKey')}</span>
            <input
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder={t('admin.apiKeyHint')}
              autoComplete="off"
              required
            />
          </label>

          <label className="g-modal-remember">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(event) => setRememberKey(event.target.checked)}
            />
            <span>{t('admin.rememberKey')}</span>
          </label>

          {error && <p className="g-modal-error">{error}</p>}

          <p className="g-modal-note">{t('admin.deployNote')}</p>

          <div className="g-modal-actions">
            <button type="button" className="g-modal-btn secondary" onClick={onClose} disabled={saving}>
              {t('admin.cancel')}
            </button>
            <button type="submit" className="g-modal-btn primary" disabled={saving}>
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
