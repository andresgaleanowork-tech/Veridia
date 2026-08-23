import { useState, useMemo } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import type { Patient } from '@/types';

interface PatientSelectorProps {
  patients: Patient[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function PatientSelector({ patients, selectedId, onSelect, disabled }: PatientSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.dni?.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const selected = patients.find((p) => p.id === selectedId);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-text-3 uppercase tracking-wider mb-1.5">
        Paciente
      </label>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-surface border border-border text-left transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
            {selected ? `${selected.nombre[0]}${selected.apellidos[0]}` : <User size={14} />}
          </div>
          <div className="min-w-0">
            {selected ? (
              <span className="text-sm font-medium text-text truncate block">
                {selected.nombre} {selected.apellidos}
              </span>
            ) : (
              <span className="text-sm text-text-3">Seleccione un paciente</span>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-text-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-full glass-card border-border shadow-glow overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar paciente..."
                  className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-text-3">Sin resultados</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      p.id === selectedId ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-text'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-xs font-medium text-text-2 shrink-0">
                      {p.nombre[0]}{p.apellidos[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.nombre} {p.apellidos}
                      </div>
                      {p.dni && <div className="text-xs text-text-3">DNI: {p.dni}</div>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
