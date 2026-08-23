import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, FileText, Edit, Trash2, Copy, Eye } from 'lucide-react';
import api from '@/lib/api';
import type { ClinicalTemplate } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Table, type TableColumn, type TableAction } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

const TIPO_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'meal_plan', label: 'Plan de comidas' },
  { value: 'note', label: 'Nota clínica' },
  { value: 'report', label: 'Informe' },
] as const;

interface TemplateFormData {
  nombre: string;
  tipo: 'meal_plan' | 'note' | 'report';
  contenido: string;
  tags: string;
}

export function TemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ClinicalTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<ClinicalTemplate | null>(null);
  const qc = useQueryClient();
  const { addToast } = useToast();
  const debouncedSearch = useDebounce(search, 300);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', debouncedSearch, tipoFilter],
    queryFn: async (): Promise<ClinicalTemplate[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (tipoFilter !== 'todos') params.set('tipo', tipoFilter);
      const res = await api.get(`/templates?${params.toString()}`);
      return res.data.data || res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { nombre: string; tipo: 'meal_plan' | 'note' | 'report'; contenido: Record<string, unknown>; tags?: string[] }) =>
      api.createTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      addToast('success', 'Plantilla creada correctamente');
    },
    onError: () => addToast('error', 'Error al crear la plantilla'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ClinicalTemplate> }) =>
      api.updateTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      addToast('success', 'Plantilla actualizada correctamente');
    },
    onError: () => addToast('error', 'Error al actualizar la plantilla'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      addToast('success', 'Plantilla eliminada');
    },
    onError: () => addToast('error', 'Error al eliminar la plantilla'),
  });

  const handleSubmit = (data: TemplateFormData) => {
    let contenido: Record<string, unknown> = {};
    try {
      contenido = JSON.parse(data.contenido || '{}');
    } catch {
      contenido = { text: data.contenido };
    }

    const payload = {
      nombre: data.nombre,
      tipo: data.tipo,
      contenido,
      tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, payload });
    } else {
      createMutation.mutate(payload);
    }
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleDelete = useCallback((id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleUse = useCallback((template: ClinicalTemplate) => {
    if (template.tipo === 'meal_plan') {
      navigate('/nutrition/meal-plans');
    } else if (template.tipo === 'note') {
      navigator.clipboard.writeText(JSON.stringify(template.contenido, null, 2));
      addToast('success', 'Contenido de nota copiado al portapapeles');
    } else if (template.tipo === 'report') {
      navigate('/reports');
    }
  }, [addToast, navigate]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const columns: TableColumn<ClinicalTemplate>[] = useMemo(() => [
    { key: 'nombre', header: 'Nombre', sortable: true },
    { key: 'tipo', header: 'Tipo', render: (row) => {
      const variant = row.tipo === 'meal_plan' ? 'success' : row.tipo === 'note' ? 'info' : 'secondary';
      const label = row.tipo === 'meal_plan' ? 'Plan de comidas' : row.tipo === 'note' ? 'Nota clínica' : 'Informe';
      return <Badge variant={variant} size="sm">{label}</Badge>;
    }},
    { key: 'tags', header: 'Tags', render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.tags?.slice(0, 3).map((tag, i) => (
          <span key={i} className="text-[10px] bg-surface-3 text-text-3 px-1.5 py-0.5 rounded">{tag}</span>
        ))}
        {row.tags && row.tags.length > 3 && <span className="text-[10px] text-text-3">+{row.tags.length - 3}</span>}
      </div>
    )},
    { key: 'created_at', header: 'Creado', render: (row) => new Date(row.created_at).toLocaleDateString('es-ES') },
  ], []);

  const actions: TableAction<ClinicalTemplate>[] = useMemo(() => [
    { label: 'Ver', icon: <Eye size={14} />, onClick: (row) => setViewingTemplate(row) },
    { label: 'Usar', icon: <Copy size={14} />, onClick: (row) => handleUse(row) },
    { label: 'Editar', icon: <Edit size={14} />, onClick: (row) => { setEditingTemplate(row); setShowForm(true); } },
    { label: 'Eliminar', icon: <Trash2 size={14} />, variant: 'danger', onClick: (row) => handleDelete(row.id) },
  ], [handleDelete, handleUse]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Plantillas Clínicas</h1>
          <p className="text-text-3 text-sm mt-1">Gestiona plantillas para planes de comida, notas e informes</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setShowForm(true); }} icon={<Plus size={16} />}>
          Nueva Plantilla
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Buscar plantillas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          className="flex-1 min-w-[200px]"
        />
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border overflow-x-auto scrollbar-none">
          {TIPO_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={tipoFilter === f.value ? 'primary' : 'ghost'}
              onClick={() => setTipoFilter(f.value)}
              className={
                tipoFilter === f.value
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent whitespace-nowrap'
              }
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <Table columns={columns} data={[]} keyExtractor={(r) => r.id} loading />
        </Card>
      ) : !templates?.length ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-text-3" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-1">No hay plantillas</h3>
          <p className="text-text-3 text-sm mb-4">
            {search ? 'No se encontraron resultados para tu búsqueda' : 'Comienza añadiendo tu primera plantilla'}
          </p>
          {!search && (
            <Button onClick={() => { setEditingTemplate(null); setShowForm(true); }} icon={<Plus size={16} />}>
              Nueva Plantilla
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-0">
          <Table
            columns={columns}
            data={templates}
            keyExtractor={(r) => r.id}
            actions={actions}
          />
        </Card>
      )}

      <TemplateFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTemplate(null); }}
        initialData={editingTemplate}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <TemplateDetailDialog
        open={!!viewingTemplate}
        onClose={() => setViewingTemplate(null)}
        template={viewingTemplate}
      />
    </div>
  );
}

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData: ClinicalTemplate | null;
  onSubmit: (data: TemplateFormData) => void;
  isSubmitting: boolean;
}

function TemplateFormDialog({ open, onClose, initialData, onSubmit, isSubmitting }: TemplateFormDialogProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'meal_plan' | 'note' | 'report'>('meal_plan');
  const [contenido, setContenido] = useState('{}');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setNombre(initialData.nombre);
        setTipo(initialData.tipo);
        setContenido(JSON.stringify(initialData.contenido, null, 2));
        setTags(initialData.tags?.join(', ') || '');
      } else {
        setNombre('');
        setTipo('meal_plan');
        setContenido('{}');
        setTags('');
      }
      setError('');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    onSubmit({ nombre, tipo, contenido, tags });
  };

  return (
    <Dialog open={open} onClose={onClose} title={initialData ? 'Editar Plantilla' : 'Nueva Plantilla'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-text-2 mb-1.5">Nombre *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Plan estándar diabetes tipo 2"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-2 mb-1.5">Tipo</label>
          <Select
            value={tipo}
            onValueChange={(v) => setTipo(v as typeof tipo)}
            options={[
              { value: 'meal_plan', label: 'Plan de comidas' },
              { value: 'note', label: 'Nota clínica' },
              { value: 'report', label: 'Informe' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-2 mb-1.5">Contenido (JSON)</label>
          <Textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={8}
            placeholder='{ "kcal": 2000, "prot": 120, ... }'
            className="font-mono text-xs"
          />
          <p className="text-xs text-text-3 mt-1">Introduce el contenido como JSON. Si no es JSON válido, se guardará como texto.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-2 mb-1.5">Tags (separados por coma)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="diabetes, estándar, revisión"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50">
            {isSubmitting ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Plantilla'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

interface TemplateDetailDialogProps {
  open: boolean;
  onClose: () => void;
  template: ClinicalTemplate | null;
}

function TemplateDetailDialog({ open, onClose, template }: TemplateDetailDialogProps) {
  if (!template) return null;

  const tipoLabel = template.tipo === 'meal_plan' ? 'Plan de comidas' : template.tipo === 'note' ? 'Nota clínica' : 'Informe';

  return (
    <Dialog open={open} onClose={onClose} title={template.nombre} size="lg" description={tipoLabel}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-text-3">Tipo</span>
            <p className="text-sm text-text font-medium mt-0.5">{tipoLabel}</p>
          </div>
          <div>
            <span className="text-xs text-text-3">Creado</span>
            <p className="text-sm text-text font-medium mt-0.5">{new Date(template.created_at).toLocaleDateString('es-ES')}</p>
          </div>
        </div>
        {template.tags && template.tags.length > 0 && (
          <div>
            <span className="text-xs text-text-3">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {template.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-surface-3 text-text-2 px-2 py-0.5 rounded border border-border">{tag}</span>
              ))}
            </div>
          </div>
        )}
        <div>
          <span className="text-xs text-text-3">Contenido</span>
          <pre className="mt-2 p-4 bg-surface-2 border border-border rounded-lg text-xs text-text overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(template.contenido, null, 2)}
          </pre>
        </div>
      </div>
    </Dialog>
  );
}
