import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Match, Team } from '../../types';
import { getTeamById } from '../../utils/helpers';

interface GoalsChartProps {
  matches: Match[];
  teams: Team[];
}

export default function GoalsChart({ matches, teams }: GoalsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const finished = matches.filter(
      (m) => m.status === 'Finished' && m.homeScore != null && m.awayScore != null
    );

    const goalsByTeam = new Map<string, number>();
    finished.forEach((m) => {
      goalsByTeam.set(m.homeTeamId, (goalsByTeam.get(m.homeTeamId) ?? 0) + m.homeScore!);
      goalsByTeam.set(m.awayTeamId, (goalsByTeam.get(m.awayTeamId) ?? 0) + m.awayScore!);
    });

    const data = Array.from(goalsByTeam.entries())
      .map(([teamId, goals]) => ({
        teamId,
        goals,
        team: getTeamById(teams, teamId),
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 8);

    if (data.length === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 16, right: 16, bottom: 40, left: 16 };
    const width = containerWidth - margin.left - margin.right;
    const height = 220;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.teamId))
      .range([0, width])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.goals)! + 1])
      .range([height, 0]);

    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, data.length]);

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.teamId)!)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('rx', 6)
      .attr('fill', (_, i) => colorScale(i))
      .transition()
      .duration(800)
      .delay((_, i) => i * 80)
      .ease(d3.easeBounceOut)
      .attr('y', (d) => y(d.goals))
      .attr('height', (d) => height - y(d.goals));

    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.teamId)! + x.bandwidth() / 2)
      .attr('y', height + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .text((d) => d.team?.shortName ?? d.teamId);

    g.selectAll('.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.teamId)! + x.bandwidth() / 2)
      .attr('y', (d) => y(d.goals) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('opacity', 0)
      .text((d) => d.goals)
      .transition()
      .duration(800)
      .delay((_, i) => i * 80 + 400)
      .attr('opacity', 1);
  }, [matches, teams]);

  const hasData = matches.some(
    (m) => m.status === 'Finished' && m.homeScore != null
  );

  if (!hasData) return null;

  return (
    <div ref={containerRef} className="chart-container">
      <div className="chart-title">Top Scorers by Team</div>
      <svg ref={svgRef} role="img" aria-label="Goals scored by team chart" />
    </div>
  );
}
