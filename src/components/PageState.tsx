import { useT } from '../context/LanguageContext';

export function LoadingState() {
  const t = useT();
  return <div className="container loading-state">{t('common.loading')}</div>;
}

export function ErrorState({ message }: { message?: string }) {
  const t = useT();
  return (
    <div className="container error-state">
      {message ?? t('common.errorLoad')}
    </div>
  );
}
