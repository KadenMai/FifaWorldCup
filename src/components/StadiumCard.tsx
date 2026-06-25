import type { Match, Stadium, WeatherInfo } from '../types';
import { useT } from '../context/LanguageContext';
import { countStadiumMatches } from '../utils/helpers';

interface StadiumCardProps {
  stadium: Stadium;
  matches: Match[];
  weather?: WeatherInfo;
}

export default function StadiumCard({ stadium, matches, weather }: StadiumCardProps) {
  const matchCount = countStadiumMatches(stadium.id, matches);
  const t = useT();

  return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{stadium.name}</div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
        {stadium.city}{stadium.state ? `, ${stadium.state}` : ''} · {stadium.country}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
        {stadium.capacity && (
          <span>{t('common.capacity')}: {stadium.capacity.toLocaleString()}</span>
        )}
        <span>{t('stadiums.matchesHosted', { count: matchCount })}</span>
      </div>
      {weather && (
        <div style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          🌤️ {weather.condition}
          {weather.temperatureF != null && ` · ${weather.temperatureF}°F`}
        </div>
      )}
    </div>
  );
}
