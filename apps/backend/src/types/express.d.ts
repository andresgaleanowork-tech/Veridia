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
      isPatient?: boolean;
      apiKey?: any;
    }

    interface Response {
      success(data: any, meta?: Record<string, any>): Response;
      paginated(data: any[], total: number, page?: number, limit?: number): Response;
      created(data: any, meta?: Record<string, any>): Response;
      error(status: number, message: string, details?: any): Response;
    }
  }
}

export {};
