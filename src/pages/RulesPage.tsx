import type { ReactNode } from 'react';
import { useT } from '../context/LanguageContext';

const FIFA_REGULATIONS_URL =
  'https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf';

const THIRD_PLACE_R32_SLOTS = [
  { match: '74', winner: 'E' },
  { match: '77', winner: 'I' },
  { match: '79', winner: 'A' },
  { match: '80', winner: 'L' },
  { match: '81', winner: 'D' },
  { match: '82', winner: 'G' },
  { match: '85', winner: 'B' },
  { match: '87', winner: 'K' },
] as const;

const GROUP_TIEBREAKERS = [
  'rules.tiebreak.group1',
  'rules.tiebreak.group2',
  'rules.tiebreak.group3',
  'rules.tiebreak.group4',
  'rules.tiebreak.group5',
] as const;

const THIRD_TIEBREAKERS = [
  'rules.tiebreak.third1',
  'rules.tiebreak.third2',
  'rules.tiebreak.third3',
  'rules.tiebreak.third4',
  'rules.tiebreak.third5',
] as const;

const KNOCKOUT_ROUNDS = [
  { key: 'rules.knockout.r32', teams: '32 → 16' },
  { key: 'rules.knockout.r16', teams: '16 → 8' },
  { key: 'rules.knockout.qf', teams: '8 → 4' },
  { key: 'rules.knockout.sf', teams: '4 → 2' },
  { key: 'rules.knockout.third', teams: '2' },
  { key: 'rules.knockout.final', teams: '2' },
] as const;

function RulesSection({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <section className="g-panel rules-section">
      <div className="g-panel-header">
        {icon && <div className="g-panel-trophy" aria-hidden="true">{icon}</div>}
        <div className="g-panel-title">{title}</div>
      </div>
      <div className="g-panel-body rules-body">{children}</div>
    </section>
  );
}

export default function RulesPage() {
  const t = useT();

  return (
    <div className="container rules-page">
      <header className="rules-hero">
        <h1 className="page-title">{t('rules.title')}</h1>
        <p className="page-subtitle">{t('rules.subtitle')}</p>
      </header>

      <RulesSection title={t('rules.overviewTitle')} icon="🏆">
        <p className="rules-lead">{t('rules.overviewLead')}</p>
        <div className="rules-stat-grid">
          <div className="rules-stat">
            <span className="rules-stat-value">48</span>
            <span className="rules-stat-label">{t('rules.statTeams')}</span>
          </div>
          <div className="rules-stat">
            <span className="rules-stat-value">12</span>
            <span className="rules-stat-label">{t('rules.statGroups')}</span>
          </div>
          <div className="rules-stat">
            <span className="rules-stat-value">104</span>
            <span className="rules-stat-label">{t('rules.statMatches')}</span>
          </div>
          <div className="rules-stat">
            <span className="rules-stat-value">8</span>
            <span className="rules-stat-label">{t('rules.statChampionGames')}</span>
          </div>
        </div>
        <p className="rules-note">{t('rules.groupStageNote')}</p>
      </RulesSection>

      <RulesSection title={t('rules.advanceTitle')} icon="📊">
        <p>{t('rules.advanceLead')}</p>
        <table className="rules-table">
          <thead>
            <tr>
              <th>{t('rules.advanceFrom')}</th>
              <th>{t('rules.advanceCount')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('rules.advanceFirst')}</td>
              <td>12</td>
            </tr>
            <tr>
              <td>{t('rules.advanceSecond')}</td>
              <td>12</td>
            </tr>
            <tr className="rules-table-highlight">
              <td>{t('rules.advanceThird')}</td>
              <td>8</td>
            </tr>
            <tr className="rules-table-total">
              <td><strong>{t('rules.advanceTotal')}</strong></td>
              <td><strong>32</strong></td>
            </tr>
          </tbody>
        </table>
        <p className="rules-note rules-note-warn">{t('rules.advanceEliminated')}</p>
      </RulesSection>

      <RulesSection title={t('rules.thirdPlaceTitle')} icon="🥉">
        <p>{t('rules.thirdPlaceLead')}</p>
        <ol className="rules-ordered-list">
          {THIRD_TIEBREAKERS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        <p className="rules-note">{t('rules.thirdPlaceGroupNote')}</p>
      </RulesSection>

      <RulesSection title={t('rules.tiebreakTitle')} icon="⚖️">
        <p>{t('rules.tiebreakGroupLead')}</p>
        <ol className="rules-ordered-list">
          {GROUP_TIEBREAKERS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
      </RulesSection>

      <RulesSection title={t('rules.r32Title')} icon="⚽">
        <p>{t('rules.r32Lead')}</p>
        <div className="rules-split-cards">
          <div className="rules-card rules-card-accent">
            <div className="rules-card-value">8</div>
            <div className="rules-card-label">{t('rules.r32WithThird')}</div>
          </div>
          <div className="rules-card">
            <div className="rules-card-value">8</div>
            <div className="rules-card-label">{t('rules.r32WithoutThird')}</div>
          </div>
        </div>
        <p>{t('rules.r32WinnersNote')}</p>
        <table className="rules-table rules-table-compact">
          <thead>
            <tr>
              <th>{t('rules.r32Match')}</th>
              <th>{t('rules.r32Home')}</th>
              <th>{t('rules.r32Away')}</th>
            </tr>
          </thead>
          <tbody>
            {THIRD_PLACE_R32_SLOTS.map((row) => (
              <tr key={row.match}>
                <td>M{row.match}</td>
                <td>{t('rules.groupWinner', { group: row.winner })}</td>
                <td>{t('rules.thirdPlaceAnnex')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rules-note">{t('rules.r32OtherNote')}</p>
      </RulesSection>

      <RulesSection title={t('rules.annexTitle')} icon="📋">
        <p>{t('rules.annexLead')}</p>
        <div className="rules-example">
          <div className="rules-example-label">{t('rules.annexExample')}</div>
          <code className="rules-example-code">A,B,C,D,E,F,G,H</code>
          <ul className="rules-mapping-list">
            <li><span>1A</span> → <span>3H</span></li>
            <li><span>1B</span> → <span>3G</span></li>
            <li><span>1D</span> → <span>3B</span></li>
            <li><span>1E</span> → <span>3C</span></li>
            <li><span>1G</span> → <span>3A</span></li>
            <li><span>1I</span> → <span>3F</span></li>
            <li><span>1K</span> → <span>3D</span></li>
            <li><span>1L</span> → <span>3E</span></li>
          </ul>
        </div>
        <p className="rules-note">{t('rules.annexNoDraw')}</p>
      </RulesSection>

      <RulesSection title={t('rules.knockoutTitle')} icon="🗓️">
        <div className="rules-flow">
          {KNOCKOUT_ROUNDS.map((round, index) => (
            <div key={round.key} className="rules-flow-step">
              <div className="rules-flow-badge">{round.teams}</div>
              <div className="rules-flow-label">{t(round.key)}</div>
              {index < KNOCKOUT_ROUNDS.length - 1 && (
                <div className="rules-flow-arrow" aria-hidden="true">↓</div>
              )}
            </div>
          ))}
        </div>
      </RulesSection>

      <section className="g-panel rules-source">
        <div className="g-panel-body rules-body">
          <p className="rules-source-text">{t('rules.sourceNote')}</p>
          <a
            href={FIFA_REGULATIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rules-source-link"
          >
            {t('rules.sourceLink')} ↗
          </a>
        </div>
      </section>
    </div>
  );
}
