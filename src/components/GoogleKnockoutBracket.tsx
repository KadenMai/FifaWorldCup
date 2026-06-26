import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import type { Match, Team } from '../types';
import { useLanguage, useT } from '../context/LanguageContext';
import TeamFlag from './TeamFlag';
import { formatMatchKickoff, getTeamById } from '../utils/helpers';
import {
  BRACKET_TREE_ROUNDS,
  bracketConnectorPath,
  getBracketConnectors,
  getBracketMatchTop,
  getBracketMatchesByRound,
  getBracketTreeHeight,
  resolveBracket,
  type BracketRound,
  type ResolvedBracketMatch,
} from '../utils/bracketHelpers';

interface GoogleKnockoutBracketProps {
  matches: Match[];
  teams: Team[];
}

const CARD_H = 90;
const CARD_GAP = 12;
const ROUND_W = 200;
const ROUND_GAP = 56;
const HEADER_H = 36;
const CONNECTOR_STUB = Math.floor(ROUND_GAP / 2);

const ROUND_LABEL_KEYS: Record<BracketRound, string> = {
  r32: 'bracket.round32',
  r16: 'bracket.round16',
  qf: 'bracket.quarter',
  sf: 'bracket.semi',
  third: 'bracket.third',
  final: 'bracket.final',
};

function BracketTeamRow({
  teamId,
  teams,
  tbd,
}: {
  teamId: string | null;
  teams: Team[];
  tbd: string;
}) {
  const team = teamId ? getTeamById(teams, teamId) : undefined;

  if (!team) {
    return (
      <div className="g-bracket-team g-bracket-team-tbd">
        <span className="g-bracket-tbd-icon" aria-hidden />
        <span className="g-bracket-team-name">{tbd}</span>
      </div>
    );
  }

  return (
    <div className="g-bracket-team">
      <TeamFlag team={team} size={18} />
      <span className="g-bracket-team-name">{team.name}</span>
    </div>
  );
}

function BracketCard({
  match,
  teams,
  tbd,
  locale,
  highlight,
}: {
  match: ResolvedBracketMatch;
  teams: Team[];
  tbd: string;
  locale: string;
  highlight?: boolean;
}) {
  const matchId = `match-${String(match.id).padStart(3, '0')}`;

  return (
    <Link to={`/matches/${matchId}`} className={`g-bracket-card g-bracket-card-link${highlight ? ' g-bracket-card-final' : ''}`}>
      <div className="g-bracket-card-time">
        {formatMatchKickoff(match.date, match.time, match.timezone, locale)}
      </div>
      <BracketTeamRow teamId={match.homeTeamId} teams={teams} tbd={tbd} />
      <BracketTeamRow teamId={match.awayTeamId} teams={teams} tbd={tbd} />
    </Link>
  );
}

export default function GoogleKnockoutBracket({ matches, teams }: GoogleKnockoutBracketProps) {
  const t = useT();
  const { locale, lang } = useLanguage();
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const setCardRef = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const groupMatches = useMemo(
    () => matches.filter((m) => m.round === 'Group Stage' || m.group),
    [matches]
  );
  const knockoutMatches = useMemo(
    () => matches.filter((m) => m.round && m.round !== 'Group Stage' && !m.group),
    [matches]
  );

  const resolved = useMemo(
    () => resolveBracket(teams, groupMatches, knockoutMatches),
    [teams, groupMatches, knockoutMatches]
  );
  const byRound = useMemo(() => getBracketMatchesByRound(resolved), [resolved]);
  const connectors = useMemo(() => getBracketConnectors(byRound), [byRound]);

  const thirdMatch = byRound.get('third')?.[0];
  const r32Count = byRound.get('r32')?.length ?? 16;
  const treeHeight = getBracketTreeHeight(0, r32Count, CARD_H, CARD_GAP);

  const displayRounds = useMemo(
    () =>
      BRACKET_TREE_ROUNDS.map((round) => ({
        round,
        matches: byRound.get(round) ?? [],
      })).filter((r) => r.matches.length > 0),
    [byRound]
  );

  const getTop = (round: BracketRound, matchIdx: number) =>
    getBracketMatchTop(round, matchIdx, byRound, CARD_H, CARD_GAP);

  const finalTop = getTop('final', 0);
  const thirdTop = thirdMatch
    ? finalTop + CARD_H + CARD_GAP + 22
    : 0;
  const totalHeight =
    HEADER_H + Math.max(treeHeight, thirdTop + CARD_H) + 32;

  const totalWidth =
    20 + displayRounds.length * ROUND_W + (displayRounds.length - 1) * ROUND_GAP + 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    const svgEl = svgRef.current;
    const scrollEl = scrollRef.current;
    if (!canvas || !svgEl) return;

    const measure = (matchId: number) => {
      const el = cardRefs.current.get(matchId);
      if (!el) return null;
      const canvasBox = canvas.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      return {
        x: box.left - canvasBox.left,
        y: box.top - canvasBox.top + box.height / 2,
        right: box.right - canvasBox.left,
      };
    };

    const draw = () => {
      const paths: string[] = [];

      for (const { sources, target } of connectors) {
        const sourcePts = sources
          .map((id) => measure(id))
          .filter((p): p is NonNullable<typeof p> => p != null)
          .map((p) => ({ x: p.right, y: p.y }));

        const targetPt = measure(target);
        if (sourcePts.length === 0 || !targetPt) continue;

        paths.push(
          bracketConnectorPath(sourcePts, { x: targetPt.x, y: targetPt.y }, CONNECTOR_STUB)
        );
      }

      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();
      svg
        .selectAll('path')
        .data(paths)
        .enter()
        .append('path')
        .attr('d', (d) => d)
        .attr('class', 'g-bracket-line')
        .attr('pointer-events', 'none');
    };

    const scheduleDraw = () => requestAnimationFrame(draw);

    scheduleDraw();

    const onResize = () => scheduleDraw();
    window.addEventListener('resize', onResize);
    scrollEl?.addEventListener('scroll', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      scrollEl?.removeEventListener('scroll', onResize);
    };
  }, [connectors, lang]);

  return (
    <div className="g-bracket-google">
      <h3 className="g-bracket-heading">{t('bracket.title')}</h3>
      <div className="g-bracket-scroll" ref={scrollRef}>
        <div
          ref={canvasRef}
          className="g-bracket-canvas"
          style={{ width: totalWidth, height: totalHeight }}
        >
          <svg
            ref={svgRef}
            className="g-bracket-lines"
            width={totalWidth}
            height={totalHeight}
            aria-hidden
            style={{ pointerEvents: 'none' }}
          />

          {displayRounds.map(({ round, matches: roundMatches }, colIdx) => (
            <div
              key={round}
              className="g-bracket-round"
              style={{
                left: 20 + colIdx * (ROUND_W + ROUND_GAP),
                width: ROUND_W,
              }}
            >
              <div className="g-bracket-round-title">{t(ROUND_LABEL_KEYS[round])}</div>
              {roundMatches.map((match, matchIdx) => (
                <div
                  key={match.id}
                  ref={(el) => setCardRef(match.id, el)}
                  className="g-bracket-card-wrap"
                  style={{ top: HEADER_H + getTop(round, matchIdx) }}
                >
                  <BracketCard
                    match={match}
                    teams={teams}
                    tbd={t('bracket.tbd')}
                    locale={locale}
                    highlight={round === 'final'}
                  />
                </div>
              ))}

              {round === 'final' && thirdMatch && (
                <div
                  ref={(el) => setCardRef(thirdMatch.id, el)}
                  className="g-bracket-third-block"
                  style={{ top: HEADER_H + thirdTop }}
                >
                  <div className="g-bracket-round-subtitle">{t('bracket.third')}</div>
                  <BracketCard
                    match={thirdMatch}
                    teams={teams}
                    tbd={t('bracket.tbd')}
                    locale={locale}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
