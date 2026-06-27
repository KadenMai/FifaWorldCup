import { Link, useLocation } from 'react-router-dom';
import { useEdition } from '../context/EditionContext';
import { useT } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const location = useLocation();
  const { meta, path } = useEdition();
  const t = useT();

  const desktopItems = [
    { to: path(''), label: t('nav.home') },
    { to: path('/today'), label: t('nav.today') },
    { to: path('/teams'), label: t('nav.teams') },
    { to: path('/players'), label: t('nav.players') },
    { to: path('/coaches'), label: t('nav.coaches') },
    { to: path('/locations'), label: t('nav.locations') },
    { to: path('/standings'), label: t('nav.standings') },
  ];

  const isActive = (to: string) => {
    if (to === path('')) {
      return location.pathname === path('') || location.pathname === `/${meta.id}`;
    }
    return location.pathname.startsWith(to);
  };

  return (
    <header className="site-header">
      <div className="container">
        <Link to={path('')} className="logo">
          <span>🏆</span>
          <span>{meta.name}</span>
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
  const { path } = useEdition();
  const t = useT();

  const navItems = [
    { to: path(''), label: t('nav.matches'), icon: '⚽' },
    { to: path('/standings'), label: t('nav.standings'), icon: '📊' },
    { to: path('/teams'), label: t('nav.teams'), icon: '🏳️' },
    { to: path('/locations'), label: t('nav.venues'), icon: '🏟️' },
  ];

  const isBottomNavActive = (to: string) => {
    if (to === path('')) {
      return (
        location.pathname === path('') ||
        location.pathname.startsWith(path('/matches/'))
      );
    }
    return location.pathname.startsWith(to);
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
