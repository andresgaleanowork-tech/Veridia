import { query } from '../config/db.js';
import { createNotification } from '../services/notification-service.js';
import { createLogger } from '../utils/logger.js';

const jobsLogger = createLogger('JOBS');

const runReminderJob = async () => {
  const result = await query(`
    SELECT a.id, a.fecha, a.hora, a.tipo,
           p.id as paciente_id, p.nombre, p.apellidos, p.email, p.telefono,
           u.name as profesional_name
    FROM appointments a
    JOIN patients p ON a.paciente_id = p.id
    LEFT JOIN users u ON a.profesional = u.name::text
    WHERE a.fecha = CURRENT_DATE + INTERVAL '1 day'
      AND a.estado IN ('Pendiente', 'Confirmada')
      AND NOT EXISTS (
        SELECT 1 FROM notification_log nl
        WHERE nl.patient_id = a.paciente_id
          AND nl.type = 'appointmentReminder'
          AND nl.sent_at > NOW() - INTERVAL '12 hours'
      )
  `);

  for (const apt of result.rows) {
    const data = {
      pacienteNombre: `${apt.nombre} ${apt.apellidos}`,
      fecha: apt.fecha, hora: apt.hora, tipo: apt.tipo,
      profesional: apt.profesional_name, appointmentId: apt.id,
    };
    await createNotification({ pacienteId: apt.paciente_id, type: 'appointmentReminder', title: `Recordatorio: ${apt.tipo}`, body: `${apt.fecha} ${apt.hora}`, data });
  }
  jobsLogger.info('Processed reminders', { count: result.rows.length });
};

const runAdherenceJob = async () => {
  const result = await query(`
    SELECT p.id, p.nombre, p.apellidos, p.email,
           mp.nombre as plan_nombre, mp.id as plan_id
    FROM patients p
    JOIN meal_plans mp ON mp.paciente_id = p.id AND mp.estado = 'activo'
    WHERE NOT EXISTS (
      SELECT 1 FROM patient_food_journals pj
      WHERE pj.paciente_id = p.id AND pj.date >= CURRENT_DATE - INTERVAL '3 days'
    )
  `);

  for (const patient of result.rows) {
    await createNotification({
      pacienteId: patient.id,
      type: 'adherenceCheck',
      title: '¿Cómo va tu plan?',
      body: `No has registrado comidas en 3 días. Tu plan "${patient.plan_nombre}" te está esperando.`,
      data: { planId: patient.plan_id, planName: patient.plan_nombre },
    });
  }
  jobsLogger.info('Processed adherence checks', { count: result.rows.length });
};

const runWeeklyReportJob = async () => {
  jobsLogger.info('Running weekly professional report...');
  // TODO: Implement weekly report generation
  // This would generate reports and send to professionals
};

export function startJobs() {
  // Reminder job: every 15 minutes
  setInterval(runReminderJob, 15 * 60 * 1000);
  
  // Adherence check: every 6 hours
  setInterval(runAdherenceJob, 6 * 60 * 60 * 1000);
  
  // Weekly report: every Monday at 8 AM
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
  nextMonday.setHours(8, 0, 0, 0);
  const msUntilMonday = nextMonday.getTime() - now.getTime();
  setTimeout(() => {
    runWeeklyReportJob();
    setInterval(runWeeklyReportJob, 7 * 24 * 60 * 60 * 1000);
  }, msUntilMonday);

  // Run immediately on startup (dev only)
  if (process.env.NODE_ENV !== 'production') {
    runReminderJob();
    runAdherenceJob();
  }

  jobsLogger.info('Jobs scheduled', { 
    reminders: '15min', 
    adherence: '6h', 
    weeklyReport: 'Mondays 8am' 
  });
}

export { runReminderJob, runAdherenceJob, runWeeklyReportJob };