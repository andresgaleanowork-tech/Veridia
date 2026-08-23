import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function ServerError() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-4xl font-bold text-white mb-2">500</h1>
      <p className="text-gray-400 text-lg mb-2">Error interno del servidor</p>
      <p className="text-gray-500 text-sm mb-6">Por favor, intenta de nuevo más tarde</p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} className="bg-cyan-600 hover:bg-cyan-700">
          Reintentar
        </Button>
        <Button onClick={() => navigate('/')} variant="secondary">
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
}
