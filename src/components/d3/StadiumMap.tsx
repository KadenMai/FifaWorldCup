import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Stadium } from '../../types';
import { useEdition } from '../../context/EditionContext';
import { useT } from '../../context/LanguageContext';
import { getDataBaseUrl, getRuntimeDataVersion } from '../../data/dataLoader';

interface StadiumMapProps {
  stadiums: Stadium[];
  onSelect?: (stadium: Stadium) => void;
}

type HostGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.MultiPolygon | GeoJSON.Polygon,
  { name?: string; countryKey?: string }
>;

type Admin1GeoJson = GeoJSON.FeatureCollection<
  GeoJSON.MultiPolygon | GeoJSON.Polygon,
  { name?: string; countryKey?: string }
>;

const MAP_HEIGHT = 520;
const INITIAL_ZOOM = 1.75;

const COUNTRY_COLORS: Record<string, string> = {
  USA: '#0066b3',
  Canada: '#e63946',
  Mexico: '#2a9d8f',
};

const GEO_COUNTRY_KEY: Record<string, keyof typeof COUNTRY_COLORS> = {
  USA: 'USA',
  CAN: 'Canada',
  MEX: 'Mexico',
};

const geoCache: Record<string, { countries?: HostGeoJson; admin1?: Admin1GeoJson }> = {};

async function loadGeoJson<T>(edition: string, fileName: string): Promise<T> {
  const url = `${getDataBaseUrl()}${edition}/${fileName}?v=${getRuntimeDataVersion()}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${fileName}`);
  return response.json() as Promise<T>;
}

async function loadMapData(edition: string) {
  const cache = geoCache[edition] ?? {};
  if (cache.countries && cache.admin1) {
    return { countries: cache.countries, admin1: cache.admin1 };
  }
  const [countries, admin1] = await Promise.all([
    loadGeoJson<HostGeoJson>(edition, 'north-america.geojson'),
    loadGeoJson<Admin1GeoJson>(edition, 'admin1-boundaries.geojson'),
  ]);
  geoCache[edition] = { countries, admin1 };
  return { countries, admin1 };
}

function markerStyle(country: string) {
  return {
    fill: '#ffffff',
    stroke: COUNTRY_COLORS[country] ?? '#0f172a',
  };
}

export default function StadiumMap({ stadiums, onSelect }: StadiumMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const { edition } = useEdition();
  const t = useT();

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    let cancelled = false;
    let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
    let lastWidth = 0;

    const draw = async () => {
      const withCoords = stadiums.filter(
        (s) => s.latitude != null && s.longitude != null,
      );
      if (withCoords.length === 0) return;

      const width = container.clientWidth;
      if (width <= 0) return;
      if (width !== lastWidth) {
        transformRef.current = null;
        lastWidth = width;
      }

      let mapData: { countries: HostGeoJson; admin1: Admin1GeoJson };
      try {
        mapData = await loadMapData(edition);
        if (cancelled) return;
        setMapError(null);
      } catch {
        if (!cancelled) setMapError('Map data unavailable');
        return;
      }

      const { countries: geoJson, admin1 } = mapData;
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();
      svg
        .attr('width', width)
        .attr('height', MAP_HEIGHT)
        .attr('viewBox', `0 0 ${width} ${MAP_HEIGHT}`)
        .style('touch-action', 'none');

      const padding = 24;
      const stadiumPoints: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: withCoords.map((s) => ({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [s.longitude!, s.latitude!],
          },
        })),
      };

      const fitBounds: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [...geoJson.features, ...stadiumPoints.features],
      };

      const projection = d3
        .geoAlbers()
        .fitExtent(
          [
            [padding, padding],
            [width - padding, MAP_HEIGHT - padding],
          ],
          fitBounds,
        );

      const path = d3.geoPath().projection(projection);

      svg
        .append('rect')
        .attr('width', width)
        .attr('height', MAP_HEIGHT)
        .attr('fill', '#dbeafe')
        .attr('rx', 8);

      const mapLayer = svg.append('g').attr('class', 'map-layer');

      mapLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>('.country')
        .data(geoJson.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', (d) => path(d) ?? '')
        .attr('fill', (d) => {
          const key = GEO_COUNTRY_KEY[String(d.id ?? '')] ?? d.properties?.countryKey;
          return COUNTRY_COLORS[key ?? ''] ?? '#e2e8f0';
        })
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.94);

      mapLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>('.admin1')
        .data(admin1.features)
        .enter()
        .append('path')
        .attr('class', 'admin1')
        .attr('d', (d) => path(d) ?? '')
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 0.75)
        .attr('stroke-opacity', 0.65)
        .attr('pointer-events', 'none');

      const tooltip = d3
        .select(container)
        .selectAll<HTMLDivElement, unknown>('.d3-tooltip')
        .data([null])
        .join('div')
        .attr('class', 'd3-tooltip')
        .style('opacity', 0);

      const markers = mapLayer
        .selectAll<SVGGElement, Stadium>('.stadium-marker')
        .data(withCoords)
        .enter()
        .append('g')
        .attr('class', 'stadium-marker')
        .attr('transform', (d) => {
          const coords = projection([d.longitude!, d.latitude!]);
          return coords ? `translate(${coords[0]}, ${coords[1]})` : 'translate(0,0)';
        })
        .style('cursor', onSelect ? 'pointer' : 'default');

      markers
        .append('circle')
        .attr('class', 'marker-halo')
        .attr('r', 11)
        .attr('fill', (d) => markerStyle(d.country).stroke)
        .attr('opacity', 0.35);

      markers
        .append('circle')
        .attr('class', 'marker-dot')
        .attr('r', 7)
        .attr('fill', (d) => markerStyle(d.country).fill)
        .attr('stroke', (d) => markerStyle(d.country).stroke)
        .attr('stroke-width', 3);

      markers
        .append('title')
        .text((d) => `${d.name}\n${d.city}, ${d.country}`);

      markers
        .on('mouseover', function (event, d) {
          d3.select(this).select('.marker-dot').transition().duration(150).attr('r', 9);
          d3.select(this).select('.marker-halo').transition().duration(150).attr('r', 14);
          tooltip
            .style('opacity', 1)
            .html(
              `<strong>${d.name}</strong><br/>
               ${d.city}, ${d.country}<br/>
               ${d.capacity ? `Capacity: ${d.capacity.toLocaleString()}` : ''}`,
            )
            .style('left', `${event.offsetX + 12}px`)
            .style('top', `${event.offsetY - 28}px`);
        })
        .on('mouseout', function () {
          d3.select(this).select('.marker-dot').transition().duration(150).attr('r', 7);
          d3.select(this).select('.marker-halo').transition().duration(150).attr('r', 11);
          tooltip.style('opacity', 0);
        })
        .on('click', (_, d) => onSelect?.(d));

      const legend = svg.append('g').attr('transform', `translate(16, ${MAP_HEIGHT - 68})`);
      Object.entries(COUNTRY_COLORS).forEach(([country, color], i) => {
        const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
        g.append('circle')
          .attr('r', 6)
          .attr('fill', '#ffffff')
          .attr('stroke', color)
          .attr('stroke-width', 2.5);
        g.append('text')
          .attr('x', 14)
          .attr('y', 4)
          .attr('font-size', '12px')
          .attr('fill', '#334155')
          .text(country);
      });

      zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 10])
        .filter((event) => {
          if (event.type === 'wheel') return true;
          if (event.type === 'mousedown') return event.button === 0;
          return !event.ctrlKey && !event.button;
        })
        .on('zoom', (event) => {
          mapLayer.attr('transform', event.transform);
          transformRef.current = event.transform;
        });

      svg.call(zoomBehavior);

      const applyTransform = (transform: d3.ZoomTransform) => {
        mapLayer.attr('transform', transform.toString());
        svg.call(zoomBehavior!.transform, transform);
        transformRef.current = transform;
      };

      if (transformRef.current) {
        applyTransform(transformRef.current);
      } else {
        const projected = withCoords
          .map((s) => projection([s.longitude!, s.latitude!]))
          .filter((c): c is [number, number] => c != null);

        const xs = projected.map((c) => c[0]);
        const ys = projected.map((c) => c[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

        applyTransform(
          d3.zoomIdentity
            .translate(width / 2, MAP_HEIGHT / 2)
            .scale(INITIAL_ZOOM)
            .translate(-cx, -cy),
        );
      }

      const controls = d3.select(container).selectAll<HTMLDivElement, unknown>('.stadium-map-controls').data([null]);
      controls
        .join('div')
        .attr('class', 'stadium-map-controls')
        .html(`
          <button type="button" class="stadium-map-btn" data-action="zoom-in" aria-label="${t('stadiums.mapZoomIn')}">+</button>
          <button type="button" class="stadium-map-btn" data-action="zoom-out" aria-label="${t('stadiums.mapZoomOut')}">−</button>
          <button type="button" class="stadium-map-btn stadium-map-btn-reset" data-action="reset" aria-label="${t('stadiums.mapZoomReset')}">⟲</button>
        `);

      controls.selectAll<HTMLButtonElement, unknown>('.stadium-map-btn').on('click', function () {
        const action = this.dataset.action;
        const current = transformRef.current ?? d3.zoomIdentity;
        const centerX = width / 2;
        const centerY = MAP_HEIGHT / 2;

        if (action === 'zoom-in') {
          applyTransform(current.translate(centerX, centerY).scale(1.35).translate(-centerX, -centerY));
        } else if (action === 'zoom-out') {
          applyTransform(current.translate(centerX, centerY).scale(1 / 1.35).translate(-centerX, -centerY));
        } else if (action === 'reset') {
          const projected = withCoords
            .map((s) => projection([s.longitude!, s.latitude!]))
            .filter((c): c is [number, number] => c != null);
          const xs = projected.map((c) => c[0]);
          const ys = projected.map((c) => c[1]);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          applyTransform(
            d3.zoomIdentity
              .translate(width / 2, MAP_HEIGHT / 2)
              .scale(INITIAL_ZOOM)
              .translate(-cx, -cy),
          );
        }
      });
    };

    draw();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 150);
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      observer.disconnect();
      d3.select(container).selectAll('.d3-tooltip').remove();
      d3.select(container).selectAll('.stadium-map-controls').remove();
    };
  }, [stadiums, onSelect, t, edition]);

  return (
    <div ref={containerRef} className="chart-container stadium-map-wrap" style={{ position: 'relative' }}>
      <div className="chart-title">{t('stadiums.mapTitle')}</div>
      <p className="stadium-map-hint">{t('stadiums.mapHint')}</p>
      {mapError && <p className="map-error">{mapError}</p>}
      <svg ref={svgRef} role="img" aria-label="Map of FIFA 2026 host stadiums" />
    </div>
  );
}
