import { Link } from 'react-router-dom';
import { CircleX, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

export function NotFoundPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary-glow flex items-center justify-center mb-4">
          <CircleX className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">
          {t('common.pageNotFound')}
        </h1>
        <p className="text-text-3 text-sm mb-6">
          {t('common.pageNotFoundDesc')}
        </p>
        <Link to="/">
          <Button icon={<Home size={18} />}>{t('common.goToDashboard')}</Button>
        </Link>
      </Card>
    </div>
  );
}
