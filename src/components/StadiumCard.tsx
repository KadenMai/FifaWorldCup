import type { Match, Stadium } from '../types';
import { useT } from '../context/LanguageContext';
import { countStadiumMatches, formatStadiumLabel } from '../utils/helpers';

interface StadiumCardProps {
  stadium: Stadium;
  matches: Match[];
}

export default function StadiumCard({ stadium, matches }: StadiumCardProps) {
  const matchCount = countStadiumMatches(stadium.id, matches);
  const t = useT();

  return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{formatStadiumLabel(stadium)}</div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
        {stadium.capacity && (
          <span>{t('common.capacity')}: {stadium.capacity.toLocaleString()}</span>
        )}
        <span>{t('stadiums.matchesHosted', { count: matchCount })}</span>
      </div>
    </div>
  );
}
