import ics from 'ics';
import { db } from '../config/db.js';
import { appointments } from '../db/schema/index.js';
import { and, gte, lte } from 'drizzle-orm';

export async function generateICalFeed(): Promise<string> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  const events = await db.select().from(appointments)
    .where(and(gte(appointments.fecha, startDate.toISOString().split('T')[0]), lte(appointments.fecha, endDate.toISOString().split('T')[0])))
    .orderBy(appointments.fecha);

  const icalEvents: ics.EventAttributes[] = events.map(event => {
    const [year, month, day] = (event.fecha || '').split('-').map(Number);
    const [hours, minutes] = (event.hora || '00:00').split(':').map(Number);
    return {
      start: [year, month, day, hours || 9, minutes || 0],
      duration: { hours: 1 },
      title: `${event.tipo || 'Cita'} - ${event.pacienteId || 'Sin paciente'}`,
      description: event.nota || event.asunto || '',
      location: event.lugar || '',
      status: 'CONFIRMED' as const,
      uid: event.id,
    };
  });

  const { value, error } = ics.createEvents(icalEvents);
  if (error) throw error;
  return value || '';
}
