import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, User, MoreVertical, Phone, Mail, Eye, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Patient } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableColumn, TableAction } from '@/components/ui/Table';
import { PatientFormDialog } from './PatientFormDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/Toast';

const PATIENTS_QUERY_KEY = ['patients'] as const;

function getAge(p: Patient): number | null {
  if (!p.fecha_nacimiento) return null;
  const birth = new Date(p.fecha_nacimiento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { addToast } = useToast();

  const navigate = (path: string) => {
    window.location.href = path;
  };

  const { data: patients, isLoading } = useQuery({
    queryKey: [...PATIENTS_QUERY_KEY, debouncedSearch, filter],
    queryFn: async (): Promise<Patient[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filter !== 'all') params.set('activo', filter === 'active' ? 'true' : 'false');
      const res = await api.get(`/patients?${params.toString()}`);
      return res.data.patients || res.data.data || res.data;
    },
  });

  const columns = useMemo<TableColumn<Patient>[]>(() => [
    { key: 'avatar', header: '', width: 50 },
    { key: 'nombre', header: 'Paciente', sortable: true },
    { key: 'dni', header: 'DNI', sortable: true },
    { key: 'edad', header: 'Edad', sortable: true },
    { key: 'sexo', header: 'Sexo', sortable: true },
    { key: 'contacto', header: 'Contacto', sortable: true },
    { key: 'estado', header: 'Estado', sortable: true },
    { key: 'created_at', header: 'Creado', sortable: true },
  ], []);

  const actions = useMemo<TableAction<Patient>[]>(() => [
    { label: 'Ver', icon: <Eye size={14} />, onClick: (row) => navigate(`/patients/${row.id}`) },
    { label: 'Editar', icon: <Edit size={14} />, onClick: (row) => setEditingId(row.id) },
    { label: 'Eliminar', icon: <Trash2 size={14} />, variant: 'danger', onClick: (row) => handleDelete(row) },
  ], []);

  const handleDelete = async (row: Patient) => {
    if (!confirm(`¿Eliminar a ${row.nombre} ${row.apellidos}?`)) return;
    try {
      await api.delete(`/patients/${row.id}`);
      addToast('success', 'Paciente eliminado');
    } catch {
      addToast('error', 'Error al eliminar paciente');
    }
  };

  const renderRow = (row: Patient) => ({
    avatar: <Avatar fallback={`${row.nombre[0]}${row.apellidos[0]}`} size="sm" />,
    nombre: (
      <Link to={`/patients/${row.id}`} className="font-medium text-text hover:text-primary transition-colors">
        {row.nombre} {row.apellidos}
      </Link>
    ),
    dni: row.dni || '-',
    edad: getAge(row) ? `${getAge(row)} años` : '-',
    sexo: row.sexo || '-',
    contacto: (
      <div className="flex flex-col gap-1 text-sm">
        {row.telefono && <span className="flex items-center gap-1 text-text-3"><Phone size={10} /> {row.telefono}</span>}
        {row.email && <span className="flex items-center gap-1 text-text-3"><Mail size={10} /> {row.email}</span>}
      </div>
    ),
    estado: (
      <Badge variant={row.activo ? 'success' : 'secondary'} size="sm" dot>
        {row.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
    created_at: row.created_at ? new Date(row.created_at).toLocaleDateString('es-ES') : '-',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Pacientes</h1>
          <p className="text-text-3 text-sm mt-1">Gestión de pacientes y expedientes clínicos</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Nuevo Paciente
        </Button>
      </div>

<div className="flex gap-3 flex-wrap">
        <Input
          type="text"
          placeholder="Buscar por nombre, DNI o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          className="flex-1 min-w-[200px]"
        />
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border overflow-x-auto scrollbar-none">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'primary' : 'ghost'}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent whitespace-nowrap'
              }
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <Table
            columns={columns}
            data={[]}
            keyExtractor={(r) => r.id}
            loading={true}
          />
        </Card>
      ) : !patients?.length ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-text-3" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-1">No hay pacientes</h3>
          <p className="text-text-3 text-sm mb-4">
            {search ? 'No se encontraron resultados para tu búsqueda' : 'Comienza añadiendo tu primer paciente'}
          </p>
          {!search && (
            <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
              Añadir Paciente
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-0">
          <Table
            columns={columns}
            data={patients}
            keyExtractor={(r) => r.id}
            actions={actions}
            rowClassName={(row) => !row.activo ? 'opacity-60' : ''}
          />
        </Card>
      )}
      <PatientFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}