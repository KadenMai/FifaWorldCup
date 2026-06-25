import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function HeroAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 200;
    const height = 120;

    const particles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      r: 3 + Math.random() * 5,
    }));

    svg
      .selectAll('circle')
      .data(particles)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => d.r)
      .attr('fill', '#ffd700')
      .attr('opacity', 0.6);

    function animate() {
      svg
        .selectAll<SVGCircleElement, (typeof particles)[0]>('circle')
        .transition()
        .duration(2000 + Math.random() * 1000)
        .attr('cx', () => Math.random() * width)
        .attr('cy', () => Math.random() * height)
        .attr('opacity', 0.3 + Math.random() * 0.5)
        .on('end', animate);
    }

    animate();

    return () => {
      svg.selectAll('*').interrupt();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="hero-d3"
      viewBox="0 0 200 120"
      aria-hidden="true"
    />
  );
}
