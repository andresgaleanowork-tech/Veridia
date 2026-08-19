import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Bell, Shield, Database, Save, Key, Smartphone, Download, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

export function SettingsPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => api.put('/settings', { name, email, telefono }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.put('/settings/password', { currentPassword, newPassword }),
    onSuccess: () => { setShowPassword(false); setCurrentPassword(''); setNewPassword(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('/settings/account'),
    onSuccess: () => { logout(); navigate('/login'); },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('settings.title')}</h1>
        <p className="text-text-3 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{t('settings.profile')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('settings.name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label={t('settings.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label={t('settings.role')}
            type="text"
            value={user?.role || ''}
            disabled
          />
          <Input
            label={t('settings.phone')}
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            icon={<Save size={16} />}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? t('settings.saving') : saved ? t('settings.saved') : t('settings.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{t('settings.notifications')}</h2>
        </div>
        <div className="space-y-3">
          <Switch
            label={t('settings.clinicalAlerts')}
            description={t('settings.clinicalAlertsDesc')}
            checked={true}
            onChange={() => {}}
          />
          <Switch
            label={t('settings.upcomingAppointments')}
            description={t('settings.upcomingAppointmentsDesc')}
            checked={true}
            onChange={() => {}}
          />
          <Switch
            label={t('settings.newMessages')}
            description={t('settings.newMessagesDesc')}
            checked={false}
            onChange={() => {}}
          />
          <Switch
            label={t('settings.systemUpdates')}
            description={t('settings.systemUpdatesDesc')}
            checked={false}
            onChange={() => {}}
          />
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{t('settings.security')}</h2>
        </div>
        <div className="space-y-3">
          <button onClick={() => setShowPassword(true)} className="w-full text-left px-4 py-3 bg-surface-2 border border-border rounded-lg hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2"><Key size={14} className="text-primary" /><div className="text-sm font-medium text-text">{t('settings.changePassword')}</div></div>
            <div className="text-xs text-text-3 ml-6">{t('settings.lastPasswordChange')}</div>
          </button>
          <button className="w-full text-left px-4 py-3 bg-surface-2 border border-border rounded-lg hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2"><Smartphone size={14} className="text-primary" /><div className="text-sm font-medium text-text">{t('settings.twoFactor')}</div></div>
            <div className="text-xs text-text-3 ml-6">{t('settings.twoFactorDesc')}</div>
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{t('settings.data')}</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-surface-2 border border-border rounded-lg hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2"><Download size={14} className="text-primary" /><div className="text-sm font-medium text-text">{t('settings.exportData')}</div></div>
            <div className="text-xs text-text-3 ml-6">{t('settings.exportDataDesc')}</div>
          </button>
          <button onClick={() => setShowDelete(true)} className="w-full text-left px-4 py-3 bg-surface-2 border border-border rounded-lg hover:border-danger/30 transition-colors">
            <div className="flex items-center gap-2"><Trash2 size={14} className="text-danger" /><div className="text-sm font-medium text-danger">{t('settings.deleteAccount')}</div></div>
            <div className="text-xs text-text-3 ml-6">{t('settings.deleteAccountDesc')}</div>
          </button>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPassword} onClose={() => setShowPassword(false)} title={t('settings.changePassword')}>
        <div className="space-y-4">
          <Input
            label={t('settings.currentPassword')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label={t('settings.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowPassword(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={passwordMutation.isPending}
              onClick={() => passwordMutation.mutate()}
              disabled={passwordMutation.isPending || !currentPassword || !newPassword}
              className="flex-1"
            >
              {passwordMutation.isPending ? t('settings.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title={t('settings.deleteAccount')}>
        <div className="space-y-4">
          <p className="text-sm text-text-3">{t('settings.confirmDelete')}</p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowDelete(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              {deleteMutation.isPending ? t('settings.deleting') : t('settings.deleteAccount')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}