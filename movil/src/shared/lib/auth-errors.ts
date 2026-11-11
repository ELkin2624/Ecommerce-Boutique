/**
 * Normaliza errores de red o del backend en mensajes claros para el usuario.
 */
export function normalizeAuthError(error: unknown): Error {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    const message = (error as { message?: string }).message;

    if (status === 401) {
      return new Error('Correo electrónico o contraseña incorrectos.');
    }
    if (status === 409) {
      return new Error('Este correo electrónico ya está registrado en esta tienda.');
    }
    if (status === 400) {
      return new Error(message || 'Verifica los datos ingresados e intenta nuevamente.');
    }
    return new Error(message || 'Error al procesar la solicitud de autenticación.');
  }

  if (error instanceof Error) {
    if (error.message.includes('Network request failed')) {
      return new Error('No se pudo conectar con el servidor de la tienda. Verifica tu conexión.');
    }
    return error;
  }

  return new Error('Ocurrió un error inesperado. Intenta nuevamente.');
}
