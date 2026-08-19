import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

export function PortalJournalPage() {
  const { data: journals, isLoading } = useQuery({
    queryKey: ['portal-journals'],
    queryFn: async () => {
      const res = await api.get('/portal/journal');
      return res.data || [];
    },
  });

  if (isLoading) return <div className="space-y-4">Cargando journal...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Mi Journal</h1>
      {!journals?.length ? (
        <Card className="p-8 text-center text-text-3">No hay entradas de journal</Card>
      ) : (
        <div className="grid gap-4">
          {journals.map((entry: any) => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text">{new Date(entry.date).toLocaleDateString()}</h3>
                  <p className="text-sm text-text-3">
                    {entry.meals?.length || 0} comidas | Agua: {entry.water_intake || 0}ml
                  </p>
                </div>
                {entry.mood && (
                  <span className="text-2xl">
                    {entry.mood === 'great' ? '😁' : entry.mood === 'good' ? '🙂' : entry.mood === 'neutral' ? '😐' : entry.mood === 'bad' ? '🙁' : '😫'}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
