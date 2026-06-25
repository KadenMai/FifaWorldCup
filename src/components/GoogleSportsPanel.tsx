import type { ReactNode } from 'react';
import { useT } from '../context/LanguageContext';

interface GoogleSportsPanelProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  tabs?: ReactNode;
}

export default function GoogleSportsPanel({
  title,
  subtitle,
  children,
  tabs,
}: GoogleSportsPanelProps) {
  const t = useT();

  return (
    <div className="g-panel">
      <div className="g-panel-header">
        <div className="g-panel-trophy" aria-hidden="true">🏆</div>
        <div>
          <div className="g-panel-title">{title ?? t('app.title')}</div>
          {subtitle && <div className="g-panel-subtitle">{subtitle}</div>}
        </div>
      </div>
      {tabs}
      <div className="g-panel-body">{children}</div>
    </div>
  );
}
