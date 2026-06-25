import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import Header, { BottomNav } from './components/Header';
import HomePage from './pages/HomePage';
import TodayGamesPage from './pages/TodayGamesPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import PlayersPage from './pages/PlayersPage';
import CoachesPage from './pages/CoachesPage';
import StadiumsPage from './pages/StadiumsPage';
import StandingsPage from './pages/StandingsPage';
import MatchDetailPage from './pages/MatchDetailPage';
import WeatherPage from './pages/WeatherPage';

export default function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <BrowserRouter>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/today" element={<TodayGamesPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/:teamId" element={<TeamDetailPage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/coaches" element={<CoachesPage />} />
              <Route path="/locations" element={<StadiumsPage />} />
              <Route path="/standings" element={<StandingsPage />} />
              <Route path="/matches/:matchId" element={<MatchDetailPage />} />
              <Route path="/weather" element={<WeatherPage />} />
            </Routes>
          </main>
          <BottomNav />
        </BrowserRouter>
      </DataProvider>
    </LanguageProvider>
  );
}
