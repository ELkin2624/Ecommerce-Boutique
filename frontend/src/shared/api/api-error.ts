export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  statusCode: number;
  error?: string;
  details?: string | string[];

  constructor(statusCode: number, message: string, error?: string, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }

  static fromAxiosError(err: any): ApiError {
    if (err.response?.data) {
      const data = err.response.data as ApiErrorResponse;
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Error en la petición';
      return new ApiError(err.response.status, message, data.error, data.message);
    }
    if (err.request) {
      return new ApiError(0, 'No se pudo conectar con el servidor NestJS (Verifique su conexión o si el backend está activo)');
    }
    return new ApiError(500, err.message || 'Error desconocido');
  }
}
