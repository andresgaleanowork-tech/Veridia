import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MessageSquare, User, Send, X } from 'lucide-react';
import api from '@/lib/api';
import type { Message } from '@/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

export function MessagesPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async (): Promise<Message[]> => {
      const res = await api.get('/messages');
      return res.data.messages || res.data.data || res.data || [];
    },
  });

  const [draft, setDraft] = useState('');

  const unreadCount = useMemo(() => messages?.filter((m) => !m.read && m.sender === 'patient').length || 0, [messages]);

  const grouped = useMemo(() => (messages || []).reduce((acc, msg) => {
    const key = msg.paciente_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {} as Record<string, Message[]>), [messages]);

  const messageItems = useMemo(() => Object.entries(grouped).map(([patientId, msgs]) => {
    const lastMsg = msgs[msgs.length - 1];
    const hasUnread = msgs.some((m) => !m.read && m.sender === 'patient');
    return (
      <Card
        key={patientId}
        className={`p-4 hover:border-primary/20 transition-all cursor-pointer ${hasUnread ? 'border-l-[3px] border-l-primary' : ''}`}
      >
        <div className="flex items-start gap-3">
          <Avatar
            fallback={patientId.slice(0, 1).toUpperCase()}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${hasUnread ? 'font-bold text-text' : 'font-medium text-text'}`}>
                Paciente {patientId.slice(0, 8)}
              </span>
              <span className="text-[10px] text-text-3">
                {new Date(lastMsg?.created_at ?? '').toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className={`text-xs mt-1 line-clamp-1 ${hasUnread ? 'text-text' : 'text-text-3'}`}>
              {lastMsg?.sender === 'nutri' ? 'Tú: ' : ''}{lastMsg?.text ?? ''}
            </p>
          </div>
          {hasUnread && (
            <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1" />
          )}
        </div>
      </Card>
    );
  }), [grouped]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('messages.title')}</h1>
          <Badge variant="primary" size="sm" dot>
            {unreadCount > 0 ? t('messages.unreadCount', { count: unreadCount }) : t('messages.allRead')}
          </Badge>
        </div>
      </div>

      {/* Composer */}
      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              placeholder={t('messages.placeholder') || 'Escribe un mensaje...'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Redactar mensaje"
              className="w-full"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Send}
            disabled={!draft.trim()}
            aria-label="Enviar mensaje"
          >
            Enviar
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton variant="text" className="h-4 w-24" />
                    <Skeleton variant="text" className="h-3 w-12" />
                  </div>
                  <Skeleton variant="text" className="h-3 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !messages?.length ? (
        <Card className="p-12 text-center">
          <MessageSquare size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">{t('messages.noMessages')}</h3>
          <p className="text-text-3 text-sm">{t('messages.noMessagesDesc')}</p>
        </Card>
      ) : (
        <div aria-live="polite" aria-atomic="false" className="space-y-2">
          {messageItems}
        </div>
      )}
    </div>
  );
}