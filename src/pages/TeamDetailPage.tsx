import { Link, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useT } from '../context/LanguageContext';
import MatchCard from '../components/MatchCard';
import PlayerCard from '../components/PlayerCard';
import StandingsTable from '../components/StandingsTable';
import { ErrorState, LoadingState } from '../components/PageState';
import TeamFlag from '../components/TeamFlag';
import { getTeamById } from '../utils/helpers';

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { data, loading, error } = useData();
  const t = useT();

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const { teams, coaches, players, matches, stadiums, standings } = data;
  const team = getTeamById(teams, teamId ?? '');

  if (!team) {
    return (
      <div className="container error-state">
        {t('teams.notFound')}{' '}
        <Link to="/teams">{t('common.backToTeams')}</Link>
      </div>
    );
  }

  const coach = coaches.find((c) => c.id === team.coachId);
  const teamPlayers = players.filter((p) => p.teamId === team.id);
  const teamMatches = matches.filter(
    (m) => m.homeTeamId === team.id || m.awayTeamId === team.id
  );
  const teamStanding = standings.filter(
    (s) => s.teamId === team.id && s.group === team.group
  );

  return (
    <div className="container">
      <div className="detail-header">
        <span className="detail-flag">
          <TeamFlag team={team} size={56} />
        </span>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{team.name}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {t('common.group')} {team.group} · {team.confederation}
            {team.fifaRanking && ` · FIFA #${team.fifaRanking}`}
          </p>
        </div>
      </div>

      {coach && (
        <div className="card" style={{ marginBottom: 24 }}>
          <strong>{t('teams.coach')}:</strong> {coach.name} ({coach.nationality})
        </div>
      )}

      {teamStanding.length > 0 && (
        <section>
          <h2 className="section-title">{t('standings.groupStandings')}</h2>
          <StandingsTable standings={teamStanding} teams={teams} />
        </section>
      )}

      <section>
        <h2 className="section-title">{t('teams.players', { count: teamPlayers.length })}</h2>
        {teamPlayers.length === 0 ? (
          <p className="empty-state">{t('teams.noPlayers')}</p>
        ) : (
          <div className="card-grid">
            {teamPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} teams={teams} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">{t('teams.matchesSection', { count: teamMatches.length })}</h2>
        {teamMatches.length === 0 ? (
          <p className="empty-state">{t('hub.noMatches')}</p>
        ) : (
          <div className="card-grid">
            {teamMatches.map((match) => {
              const stadium = stadiums.find((s) => s.id === match.stadiumId);
              return (
                <MatchCard key={match.id} match={match} teams={teams} stadium={stadium} />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
