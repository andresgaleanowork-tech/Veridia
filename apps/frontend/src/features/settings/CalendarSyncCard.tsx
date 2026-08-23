import { useQuery } from '@tanstack/react-query';
import { Calendar, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CalendarSyncCard() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-export'],
    queryFn: async () => {
      return await api.getUnwrapped<{ url: string }>('/calendar/export');
    },
  });

  const icalUrl = data?.url || '';

  const googleUrl = icalUrl
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icalUrl)}`
    : '';

  const handleCopy = async () => {
    if (!icalUrl) return;
    await navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-primary" /> Sync de Calendario
      </h3>
      <p className="text-sm text-text-3 mb-4">
        Suscribite a tu calendario de Veridia para ver tus citas en Google Calendar, Apple Calendar o Outlook.
      </p>

      {isLoading ? (
        <div className="h-10 bg-surface animate-pulse rounded-lg" />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={14} />
              Suscribirse en Google Calendar
            </a>

            <a
              href={icalUrl}
              download="veridia-calendar.ics"
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
            >
              <Calendar size={14} />
              Descargar .ics
            </a>

            <Button variant="secondary" onClick={handleCopy} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
              {copied ? 'Copiado' : 'Copiar enlace'}
            </Button>
          </div>

          <div className="text-xs text-text-3 space-y-1 mt-3">
            <p><strong>Apple Calendar:</strong> Copiá el enlace y pegalo en Archivo → Suscribirse al calendario</p>
            <p><strong>Outlook:</strong> Copiá el enlace y pegalo en Archivo → Abrir y exportar → Importar</p>
          </div>
        </div>
      )}
    </Card>
  );
}
