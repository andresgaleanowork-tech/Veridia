import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import api from '@/lib/api';
import { captureError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';

function usePdfDownload() {
  const [loading, setLoading] = useState(false);

  const download = async (endpoint: string, filename: string) => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      captureError(error, { component: 'PDFButtons', operation: 'downloadPdf' });
    } finally {
      setLoading(false);
    }
  };

  return { loading, download };
}

export function MealPlanPDFButton({ planId, planName }: { planId: number; planName: string }) {
  const { loading, download } = usePdfDownload();
  return (
    <Button variant="secondary" size="sm" onClick={() => download(`/reports/meal-plan/${planId}/pdf`, `${planName.replace(/\s+/g, '_')}.pdf`)} disabled={loading} icon={<Download size={14} />}>
      {loading ? 'Generando...' : 'PDF'}
    </Button>
  );
}

export function InvoicePDFButton({ invoiceId, invoiceNumber }: { invoiceId: number; invoiceNumber: string }) {
  const { loading, download } = usePdfDownload();
  return (
    <Button variant="secondary" size="sm" onClick={() => download(`/reports/invoice/${invoiceId}/pdf`, `Factura_${invoiceNumber}.pdf`)} disabled={loading} icon={<FileText size={14} />}>
      {loading ? 'Generando...' : 'Factura PDF'}
    </Button>
  );
}

export function ClinicalReportPDFButton({ patientId, patientName }: { patientId: number; patientName: string }) {
  const { loading, download } = usePdfDownload();
  return (
    <Button variant="secondary" size="sm" onClick={() => download(`/reports/clinical/${patientId}/pdf`, `Reporte_${patientName.replace(/\s+/g, '_')}.pdf`)} disabled={loading} icon={<FileText size={14} />}>
      {loading ? 'Generando...' : 'Reporte PDF'}
    </Button>
  );
}
