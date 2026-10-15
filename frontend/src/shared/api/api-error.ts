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
  config?: any;
  code?: string;

  constructor(
    statusCode: number,
    message: string,
    error?: string,
    details?: string | string[],
    config?: any,
    code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.config = config;
    this.code = code;
  }

  static fromAxiosError(err: any): ApiError {
    const config = err.config || err.response?.config;
    const code = err.code;
    if (err.response?.data) {
      const data = err.response.data as ApiErrorResponse;
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Error en la petición';
      return new ApiError(err.response.status, message, data.error, data.message, config, code);
    }
    if (err.request) {
      return new ApiError(
        0,
        'No se pudo conectar con el servidor NestJS (Verifique su conexión o si el backend está activo)',
        undefined,
        undefined,
        config,
        code,
      );
    }
    return new ApiError(500, err.message || 'Error desconocido', undefined, undefined, config, code);
  }
}
