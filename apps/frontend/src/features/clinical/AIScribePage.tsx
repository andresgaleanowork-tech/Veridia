import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, FileText, Save, Trash2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import type { Patient } from '@/types';
import type { SoapNote } from './types';

interface AiScribeNote {
  id: string;
  created_at: string;
  transcription?: string;
  soap_note?: SoapNote;
}

export function AIScribePage() {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [transcription, setTranscription] = useState('');
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.patients || res.data.data || res.data || [];
    },
  });

  const { data: notes, isLoading } = useQuery({
    queryKey: ['ai-scribe-notes', selectedPatient],
    queryFn: async () => {
      if (!selectedPatient) return [];
      return await api.getUnwrapped<AiScribeNote[]>(`/ai-scribe/notes/${selectedPatient}`) ?? [];
    },
    enabled: !!selectedPatient,
  });

  const transcribeMutation = useMutation({
    mutationFn: async (data: { patientId: string; text?: string }) => {
      return await api.post('/ai-scribe/transcribe', data);
    },
    onSuccess: (data) => {
      setSoapNote(data.data.soap_note);
      setTranscription(data.data.transcription);
      qc.invalidateQueries({ queryKey: ['ai-scribe-notes'] });
      addToast('success', 'Nota generada');
    },
    onError: () => {
      addToast('error', 'Error al generar nota');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { subjective: string; objective: string; assessment: string; plan: string; status: string } }) => {
      return await api.put(`/ai-scribe/note/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-scribe-notes'] });
      addToast('success', 'Nota actualizada');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ai-scribe/note/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-scribe-notes'] });
      addToast('success', 'Nota eliminada');
    },
  });

  const handleTranscribe = () => {
    if (!selectedPatient) return addToast('error', 'Selecciona un paciente');
    transcribeMutation.mutate({ patientId: selectedPatient, text: transcription || undefined });
  };

  const handleSave = (note: { id: string; subjective: string; objective: string; assessment: string; plan: string }) => {
    updateMutation.mutate({ id: note.id, data: { ...note, status: 'finalized' } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">AI Scribe</h1>
          <p className="text-text-3 text-sm mt-1">Grabación y transcripción automática de sesiones</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} icon={<Plus size={16} />}>
          Nueva nota
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Paciente</label>
            <Select
              value={selectedPatient}
              onValueChange={setSelectedPatient}
              options={[
                { value: '', label: 'Seleccionar paciente...' },
                ...(patients?.map((p: Patient) => ({ value: p.id, label: `${p.nombre} ${p.apellidos}` })) || []),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Transcripción / Notas</label>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Escribe o pega la transcripción de la sesión..."
              rows={6}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleTranscribe} loading={transcribeMutation.isPending} icon={<FileText size={16} />}>
              Generar SOAP
            </Button>
            <Button variant="secondary" icon={<Mic size={16} />} onClick={() => setIsRecording(!isRecording)}>
              {isRecording ? 'Detener' : 'Grabar'}
            </Button>
          </div>
        </div>
      </Card>

      {soapNote && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Nota SOAP Generada</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-3 uppercase">Subjective</label>
              <Textarea value={soapNote.subjective} onChange={(e) => setSoapNote({...soapNote, subjective: e.target.value})} rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 uppercase">Objective</label>
              <Textarea value={soapNote.objective} onChange={(e) => setSoapNote({...soapNote, objective: e.target.value})} rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 uppercase">Assessment</label>
              <Textarea value={soapNote.assessment} onChange={(e) => setSoapNote({...soapNote, assessment: e.target.value})} rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 uppercase">Plan</label>
              <Textarea value={soapNote.plan} onChange={(e) => setSoapNote({...soapNote, plan: e.target.value})} rows={2} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => handleSave({ id: notes?.[0]?.id ?? '', ...soapNote })} icon={<Save size={16} />}>
              Guardar
            </Button>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold text-text mb-4">Historial de notas</h3>
        {isLoading ? (
          <div className="text-text-3 text-center py-8">Cargando...</div>
        ) : !notes?.length ? (
          <Card className="p-8 text-center text-text-3">No hay notas para este paciente</Card>
        ) : (
          <div className="space-y-3">
            {notes.map((note: AiScribeNote) => (
              <Card key={note.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-text-2">
                      {new Date(note.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-text-3 mt-1">
                      {note.transcription?.substring(0, 100)}...
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSoapNote(note.soap_note ?? null)}>
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(note.id)} icon={<Trash2 size={14} />} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showNewDialog} onClose={() => setShowNewDialog(false)} title="Nueva nota AI Scribe">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Paciente</label>
            <Select
              value={selectedPatient}
              onValueChange={setSelectedPatient}
              options={[
                { value: '', label: 'Seleccionar paciente...' },
                ...(patients?.map((p: Patient) => ({ value: p.id, label: `${p.nombre} ${p.apellidos}` })) || []),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Transcripción</label>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Escribe o pega la transcripción..."
              rows={6}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleTranscribe} loading={transcribeMutation.isPending}>Generar nota</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
