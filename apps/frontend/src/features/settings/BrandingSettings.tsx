import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Upload, Save } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function BrandingSettings() {
  const queryClient = useQueryClient();
  const [branding, setBranding] = useState({
    logo: '',
    primaryColor: '#4A7C59',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    professionalName: '',
    professionalTitle: '',
    license: '',
    cuit: '',
  });

  const { isLoading: _isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const data = await api.getUnwrapped<{ branding: typeof branding }>('/settings');
      if (data?.branding) setBranding(data.branding);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/settings', { branding });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        setBranding({ ...branding, logo: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-text flex items-center gap-2 mb-6">
        <Palette size={20} className="text-primary" /> Branding para PDFs
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-2 mb-2">Logo de la clínica</label>
          <div className="flex items-center gap-4">
            {branding.logo && (
              <img src={branding.logo} alt="Logo" className="h-16 w-16 object-contain rounded-lg bg-surface p-1" />
            )}
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-2 hover:bg-white/5 transition-colors">
              <Upload size={16} />
              {branding.logo ? 'Cambiar logo' : 'Subir logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Color primario</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
              <Input
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                placeholder="#4A7C59"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Nombre de la clínica</label>
            <Input
              value={branding.clinicName}
              onChange={(e) => setBranding({ ...branding, clinicName: e.target.value })}
              placeholder="Mi Clínica"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Dirección</label>
            <Input
              value={branding.clinicAddress}
              onChange={(e) => setBranding({ ...branding, clinicAddress: e.target.value })}
              placeholder="Av. Principal 1234"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Teléfono</label>
            <Input
              value={branding.clinicPhone}
              onChange={(e) => setBranding({ ...branding, clinicPhone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Nombre del profesional</label>
            <Input
              value={branding.professionalName}
              onChange={(e) => setBranding({ ...branding, professionalName: e.target.value })}
              placeholder="Dr. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Título</label>
            <Input
              value={branding.professionalTitle}
              onChange={(e) => setBranding({ ...branding, professionalTitle: e.target.value })}
              placeholder="Nutricionista"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Matrícula</label>
            <Input
              value={branding.license}
              onChange={(e) => setBranding({ ...branding, license: e.target.value })}
              placeholder="MN 12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">CUIT</label>
            <Input
              value={branding.cuit}
              onChange={(e) => setBranding({ ...branding, cuit: e.target.value })}
              placeholder="20-12345678-9"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            icon={<Save size={16} />}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar branding'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
