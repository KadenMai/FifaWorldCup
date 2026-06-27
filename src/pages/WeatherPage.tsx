import { useState } from 'react';
import { useData } from '../context/DataContext';
import { stadiumWeatherList } from '../data/dataLoader';
import { useT } from '../context/LanguageContext';
import SearchBar from '../components/SearchBar';
import WeatherCard from '../components/WeatherCard';
import { ErrorState, LoadingState } from '../components/PageState';

export default function WeatherPage() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const t = useT();

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const { weather, stadiums } = data;

  const stadiumWeather = stadiumWeatherList(weather, stadiums);

  const filtered = stadiumWeather.filter((w) => {
    if (!search) return true;
    const stadium = stadiums.find((s) => s.id === w.stadiumId);
    const q = search.toLowerCase();
    return (
      w.city.toLowerCase().includes(q) ||
      stadium?.name.toLowerCase().includes(q) ||
      w.condition?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      <h1 className="page-title">{t('weather.title')}</h1>
      <p className="page-subtitle">{t('weather.subtitle')}</p>

      <SearchBar value={search} onChange={setSearch} placeholder={t('weather.searchPlaceholder')} sticky />

      <div className="card-grid">
        {filtered.map((w) => {
          const stadium = stadiums.find((s) => s.id === w.stadiumId);
          return (
            <WeatherCard key={w.stadiumId} weather={w} stadium={stadium} />
          );
        })}
      </div>
    </div>
  );
}
