import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import EditionLayout from './components/EditionLayout';
import EditionHomePage from './pages/EditionHomePage';
import HomePage from './pages/HomePage';
import TodayGamesPage from './pages/TodayGamesPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import PlayersPage from './pages/PlayersPage';
import CoachesPage from './pages/CoachesPage';
import StadiumsPage from './pages/StadiumsPage';
import StandingsPage from './pages/StandingsPage';
import RulesPage from './pages/RulesPage';
import MatchDetailPage from './pages/MatchDetailPage';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EditionHomePage />} />
          <Route path="/:edition" element={<EditionLayout />}>
            <Route index element={<HomePage />} />
            <Route path="today" element={<TodayGamesPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="teams/:teamId" element={<TeamDetailPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="coaches" element={<CoachesPage />} />
            <Route path="locations" element={<StadiumsPage />} />
            <Route path="standings" element={<StandingsPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="matches/:matchId" element={<MatchDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
