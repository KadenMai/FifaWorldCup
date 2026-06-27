import type { WeatherInfo, Stadium } from '../types';
import { useLanguage, useT } from '../context/LanguageContext';
import { formatStadiumLabel } from '../utils/helpers';

interface WeatherCardProps {
  weather: WeatherInfo;
  stadium?: Stadium;
  /** Optional heading override (e.g. "At kickoff") */
  title?: string;
  /** Label for updatedAt (defaults to common.updated) */
  updatedLabel?: string;
}

export default function WeatherCard({ weather, stadium, title, updatedLabel }: WeatherCardProps) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>
        {title ?? (stadium ? formatStadiumLabel(stadium) : weather.city)}
      </div>
      {title && stadium && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {formatStadiumLabel(stadium)}
        </div>
      )}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: '2.5rem' }}>
          {weather.temperatureF != null && weather.temperatureF > 85 ? '☀️' :
           weather.temperatureF != null && weather.temperatureF < 50 ? '🌧️' : '⛅'}
        </span>
        <div>
          {weather.temperatureF != null && (
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{weather.temperatureF}°F</div>
          )}
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {weather.condition}
          </div>
        </div>
      </div>
      {weather.wind && (
        <div style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          💨 {t('common.wind')}: {weather.wind}
        </div>
      )}
      {weather.updatedAt && (
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {updatedLabel ?? t('common.updated')}: {new Date(weather.updatedAt).toLocaleString(locale)}
        </div>
      )}
    </div>
  );
}
