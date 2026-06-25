import { useData } from '../context/DataContext';
import WorldCupHub from '../components/WorldCupHub';
import { ErrorState, LoadingState } from '../components/PageState';

export default function StandingsPage() {
  const { data, loading, error } = useData();

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  return (
    <div className="container">
      <WorldCupHub data={data} defaultTab="standings" />
    </div>
  );
}
