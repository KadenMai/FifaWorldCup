import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import TeamFlag from '../TeamFlag';
import type { Match, Team } from '../../types';
import { getTeamById } from '../../utils/helpers';

interface MatchCountdownProps {
  matches: Match[];
  teams: Team[];
}

export default function MatchCountdown({ matches, teams }: MatchCountdownProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [countdown, setCountdown] = useState('');
  const [nextMatch, setNextMatch] = useState<Match | null>(null);

  useEffect(() => {
    const now = new Date();
    const upcoming = matches
      .filter((m) => m.status === 'Scheduled')
      .map((m) => ({
        match: m,
        date: new Date(`${m.date}T${m.time}:00`),
      }))
      .filter((m) => m.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcoming.length === 0) {
      setNextMatch(null);
      return;
    }

    const next = upcoming[0].match;
    setNextMatch(next);

    const tick = () => {
      const target = new Date(`${next.date}T${next.time}:00`);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Starting soon!');
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        days > 0
          ? `${days}d ${hours}h ${mins}m`
          : `${hours}h ${mins}m ${secs}s`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [matches]);

  useEffect(() => {
    if (!svgRef.current || !nextMatch) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const size = 120;
    const radius = 50;
    const innerRadius = 40;

    const arc = d3.arc<{ value: number }>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .cornerRadius(4);

    const g = svg
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);

    g.append('path')
      .datum({ value: 1 })
      .attr('d', arc.endAngle(2 * Math.PI))
      .attr('fill', '#e2e8f0');

    const progress = g
      .append('path')
      .datum({ value: 0 })
      .attr('fill', '#0066b3')
      .attr('d', arc.endAngle(0));

    progress
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const interpolate = d3.interpolate(0, 0.75);
        return (t) => {
          const datum = { value: interpolate(t) };
          return arc.endAngle(interpolate(t) * 2 * Math.PI)(datum) ?? '';
        };
      });
  }, [nextMatch]);

  if (!nextMatch) return null;

  const home = getTeamById(teams, nextMatch.homeTeamId);
  const away = getTeamById(teams, nextMatch.awayTeamId);

  return (
    <div className="chart-container" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg ref={svgRef} width={120} height={120} aria-hidden="true" />
      <div>
        <div className="chart-title">Next Match</div>
        <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <TeamFlag team={home} size={20} />
          <span>{home?.shortName}</span>
          <span>vs</span>
          <TeamFlag team={away} size={20} />
          <span>{away?.shortName}</span>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          {countdown}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {nextMatch.date} at {nextMatch.time}
        </div>
      </div>
    </div>
  );
}
