import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotResponse {
  reply: string;
  model?: string;
}

export function CopilotPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hola, soy tu Copiloto IA. Puedo ayudarte con:\n\n• **Planes de alimentación** personalizados\n• **Análisis de alimentos** y sustituciones\n• **Cálculos nutricionales** (calorías, macros, TMB)\n• **Sugerencias clínicas** basadas en datos del paciente\n• **Recipes** y preparaciones适配\n\n¿En qué puedo ayudarte?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const mutation = useMutation({
    mutationFn: async (message: string): Promise<CopilotResponse> => {
      const res = await api.post('/copilot', { message });
      return res.data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, timestamp: new Date() },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu solicitud. Intenta de nuevo.', timestamp: new Date() },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    mutation.mutate(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text">{t('copilot.title')}</h1>
        <p className="text-text-3 text-sm mt-1">{t('copilot.subtitle')}</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div aria-live="polite" aria-atomic="false" className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-surface-2 text-text border border-border rounded-bl-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-text-3'}`}>
                  {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                  <User size={14} className="text-text-3" />
                </div>
              )}
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-surface-2 border border-border rounded-xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-text-3">
                  <Loader2 size={14} className="animate-spin" />
                  {t('copilot.thinking')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('copilot.placeholder')}
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || mutation.isPending}
              className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-3">
            <Sparkles size={10} />
            {t('copilot.poweredBy')}
          </div>
        </div>
      </div>
    </div>
  );
}
