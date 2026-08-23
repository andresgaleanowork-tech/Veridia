import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 text-lg mb-6">Página no encontrada</p>
      <Button onClick={() => navigate('/')} className="bg-cyan-600 hover:bg-cyan-700">
        Volver al Inicio
      </Button>
    </div>
  );
}
