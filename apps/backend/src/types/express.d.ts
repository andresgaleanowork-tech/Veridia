declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
        initials?: string;
        paciente_id?: string;
      };
      paciente?: {
        id: string;
        email: string;
        role: string;
        name: string;
        paciente_id?: string;
      };
      paciente_id?: string;
      patient_id?: string;
      target_patient_id?: string;
      isPatient?: boolean;
      apiKey?: { active: boolean | null; id: string; scopes: string[] | null; [key: string]: unknown };
    }

    interface Response {
      success(data: unknown, meta?: Record<string, unknown>): Response;
      paginated(data: unknown[], total: number, page?: number, limit?: number): Response;
      created(data: unknown, meta?: Record<string, unknown>): Response;
      error(status: number, message: string, details?: unknown): Response;
    }
  }
}

export {};
