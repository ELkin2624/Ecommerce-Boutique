/**
 * Interface desacoplada para reconocimiento de voz (Speech-to-Text).
 * Permite cambiar la implementación concreta (WebSpeech API, Whisper local o microservicio FastAPI)
 * sin afectar la lógica de negocio ni los componentes de UI.
 */
export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd?: () => void;
}

export interface SpeechAdapter {
  /**
   * Indica si el proveedor de reconocimiento está soportado en el entorno actual.
   */
  isSupported(): boolean;

  /**
   * Inicia la captura y transcripción de voz.
   */
  start(callbacks: SpeechRecognitionCallbacks): void;

  /**
   * Detiene manualmente la captura de audio.
   */
  stop(): void;

  /**
   * Nombre del proveedor activo (ej. 'WebSpeech API', 'Whisper-FastAPI').
   */
  readonly providerName: string;

  /**
   * Indica si la transcripción garantiza funcionamiento 100% offline o si depende de servicios del navegador/red.
   */
  readonly isOfflineCapable: boolean;
}
