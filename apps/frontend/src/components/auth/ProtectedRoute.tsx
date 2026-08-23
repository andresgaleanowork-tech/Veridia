import { usePermission } from '@/hooks/usePermission';
import { useTranslation } from '@/i18n/useTranslation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { hasRole } = usePermission();
  const { t } = useTranslation();

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center border-red-500/20">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">{t('common.accessDenied')}</h1>
          <p className="text-text-3 text-sm mb-6">
            {t('common.noPermissions')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
