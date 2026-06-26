import { Link, useLocation } from 'react-router-dom';
import { useT } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const location = useLocation();
  const t = useT();

  const desktopItems = [
    { to: '/', label: t('nav.home') },
    { to: '/today', label: t('nav.today') },
    { to: '/teams', label: t('nav.teams') },
    { to: '/players', label: t('nav.players') },
    { to: '/coaches', label: t('nav.coaches') },
    { to: '/locations', label: t('nav.locations') },
    { to: '/standings', label: t('nav.standings') },
    { to: '/weather', label: t('nav.weather') },
  ];

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="logo">
          <span>🏆</span>
          <span>{t('app.title')}</span>
        </Link>
        <div className="header-actions">
          <nav className="top-nav">
            {desktopItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={isActive(item.to) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const location = useLocation();
  const t = useT();

  const navItems = [
    { to: '/', label: t('nav.matches'), icon: '⚽' },
    { to: '/standings', label: t('nav.standings'), icon: '📊' },
    { to: '/teams', label: t('nav.teams'), icon: '🏳️' },
    { to: '/locations', label: t('nav.venues'), icon: '🏟️' },
    { to: '/weather', label: t('nav.weather'), icon: '🌤️' },
  ];

  const isBottomNavActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/matches/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={isBottomNavActive(item.to) ? 'active' : ''}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
