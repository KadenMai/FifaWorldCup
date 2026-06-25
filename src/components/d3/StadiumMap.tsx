import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Stadium } from '../../types';
import { useT } from '../../context/LanguageContext';

interface StadiumMapProps {
  stadiums: Stadium[];
  onSelect?: (stadium: Stadium) => void;
}

export default function StadiumMap({ stadiums, onSelect }: StadiumMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const withCoords = stadiums.filter(
      (s) => s.latitude != null && s.longitude != null
    );
    if (withCoords.length === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const height = 400;
    const width = containerWidth;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const projection = d3
      .geoMercator()
      .center([-98, 42])
      .scale(width * 0.9)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const countryColors: Record<string, string> = {
      USA: '#0066b3',
      Canada: '#e63946',
      Mexico: '#2a9d8f',
    };

    const landFeatures: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'North America' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-130, 25], [-60, 25], [-60, 55], [-130, 55], [-130, 25],
            ]],
          },
        },
      ],
    };

    svg
      .append('path')
      .datum(landFeatures)
      .attr('d', path)
      .attr('fill', '#e8f0fe')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1);

    const tooltip = d3
      .select(containerRef.current)
      .selectAll<HTMLDivElement, unknown>('.d3-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0);

    const markers = svg
      .selectAll('.stadium-marker')
      .data(withCoords)
      .enter()
      .append('g')
      .attr('class', 'stadium-marker')
      .attr('transform', (d) => {
        const coords = projection([d.longitude!, d.latitude!]);
        return coords ? `translate(${coords[0]}, ${coords[1]})` : 'translate(0,0)';
      })
      .style('cursor', 'pointer');

    markers
      .append('circle')
      .attr('r', 0)
      .attr('fill', (d) => countryColors[d.country] ?? '#64748b')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .transition()
      .duration(600)
      .delay((_, i) => i * 80)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('r', 8);

    markers
      .append('circle')
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', (d) => countryColors[d.country] ?? '#64748b')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .transition()
      .duration(1500)
      .delay((_, i) => i * 80 + 600)
      .attr('r', 20)
      .attr('opacity', 0);

    markers
      .on('mouseover', function (event, d) {
        d3.select(this).select('circle').transition().duration(200).attr('r', 12);
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.name}</strong><br/>
             ${d.city}, ${d.country}<br/>
             ${d.capacity ? `Capacity: ${d.capacity.toLocaleString()}` : ''}`
          )
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 28}px`);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').transition().duration(200).attr('r', 8);
        tooltip.style('opacity', 0);
      })
      .on('click', (_, d) => onSelect?.(d));

    const legend = svg
      .append('g')
      .attr('transform', `translate(16, ${height - 60})`);

    Object.entries(countryColors).forEach(([country, color], i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
      g.append('circle').attr('r', 6).attr('fill', color);
      g.append('text')
        .attr('x', 14)
        .attr('y', 4)
        .attr('font-size', '12px')
        .attr('fill', '#64748b')
        .text(country);
    });

    return () => {
      tooltip.remove();
    };
  }, [stadiums, onSelect]);

  return (
    <div ref={containerRef} className="chart-container" style={{ position: 'relative' }}>
      <div className="chart-title">{t('stadiums.mapTitle')}</div>
      <svg ref={svgRef} role="img" aria-label="Map of FIFA 2026 host stadiums" />
    </div>
  );
}
