import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Standing, Team } from '../../types';
import { getTeamById, sortStandings } from '../../utils/helpers';

interface StandingsChartProps {
  standings: Standing[];
  teams: Team[];
  group: string;
}

const GROUP_COLORS = ['#0066b3', '#2a9d8f', '#e63946', '#ffd700'];

export default function StandingsChart({ standings, teams, group }: StandingsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const filtered = standings.filter((s) => s.group === group);
    const sorted = sortStandings(filtered, teams);

    if (sorted.length === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 8, right: 16, bottom: 8, left: 80 };
    const barHeight = 32;
    const height = sorted.length * (barHeight + 8) + margin.top + margin.bottom;
    const width = containerWidth;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const maxPoints = d3.max(sorted, (d) => d.points) ?? 3;

    const x = d3
      .scaleLinear()
      .domain([0, maxPoints + 1])
      .range([0, width - margin.left - margin.right]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const tooltip = d3
      .select(containerRef.current)
      .selectAll<HTMLDivElement, unknown>('.d3-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0);

    const rows = g
      .selectAll('.bar-row')
      .data(sorted)
      .enter()
      .append('g')
      .attr('class', 'bar-row')
      .attr('transform', (_, i) => `translate(0, ${i * (barHeight + 8)})`);

    rows
      .append('text')
      .attr('x', -8)
      .attr('y', barHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '13px')
      .attr('font-weight', '500')
      .text((d) => {
        const team = getTeamById(teams, d.teamId);
        return `${team?.flag ?? ''} ${team?.shortName ?? d.teamId}`;
      });

    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 4)
      .attr('height', barHeight - 8)
      .attr('width', 0)
      .attr('rx', 6)
      .attr('fill', (_, i) => GROUP_COLORS[i % GROUP_COLORS.length])
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => x(d.points));

    rows
      .append('text')
      .attr('x', (d) => x(d.points) + 8)
      .attr('y', barHeight / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('opacity', 0)
      .text((d) => `${d.points} pts`)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100 + 400)
      .attr('opacity', 1);

    rows
      .selectAll<SVGRectElement, Standing>('rect')
      .on('mouseover', function (event, d: Standing) {
        d3.select(this).attr('opacity', 0.8);
        const team = getTeamById(teams, d.teamId);
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${team?.name}</strong><br/>
             P: ${d.played} W: ${d.won} D: ${d.drawn} L: ${d.lost}<br/>
             GF: ${d.goalsFor} GA: ${d.goalsAgainst} GD: ${d.goalDifference > 0 ? '+' : ''}${d.goalDifference}`
          )
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
        tooltip.style('opacity', 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [standings, teams, group]);

  return (
    <div ref={containerRef} className="chart-container" style={{ position: 'relative' }}>
      <div className="chart-title">Group {group} — Points Chart</div>
      <svg ref={svgRef} role="img" aria-label={`Group ${group} standings chart`} />
    </div>
  );
}
