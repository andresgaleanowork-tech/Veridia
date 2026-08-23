import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/features/notifications/useNotifications';
import { Card } from '@/components/ui/Card';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-text-2 hover:text-text transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 z-50">
            <Card className="shadow-xl max-h-80 overflow-y-auto">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm text-text">Notificaciones</span>
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> Marcar todas
                </button>
              </div>
              <div className="p-2 text-center text-sm text-text-3">
                <a href="/reports" onClick={() => setOpen(false)} className="text-primary hover:underline">
                  Ver todas →
                </a>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
