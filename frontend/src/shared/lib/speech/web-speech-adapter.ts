import type { SpeechAdapter, SpeechRecognitionCallbacks } from './speech-adapter';

// Declaración de tipos para SpeechRecognition nativo del navegador
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Proveedor actual de voz basado en la Web Speech API del navegador.
 *
 * NOTA DE ARQUITECTURA:
 * La API Web Speech (`webkitSpeechRecognition`) delega la transcripción acústica a los
 * servicios del navegador (ej. servidores de Google en Chrome), por lo que NO garantiza
 * funcionamiento offline ni soporte uniforme en todos los navegadores.
 *
 * Esta clase actúa como adaptador intercambiable: el sistema de reportes está diseñado
 * para permitir sustituir este adaptador por un proveedor Whisper / FastAPI local
 * sin alterar ningún componente de la UI.
 */
export class WebSpeechAdapter implements SpeechAdapter {
  readonly providerName = 'WebSpeech API (Browser Online)';
  readonly isOfflineCapable = false;

  private recognition: any = null;
  private isListening = false;
  private lang: string;

  constructor(lang: string = 'es-BO') {
    this.lang = lang;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  start(callbacks: SpeechRecognitionCallbacks): void {
    if (!this.isSupported()) {
      callbacks.onError('El reconocimiento de voz Web Speech API no está soportado en este navegador.');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = this.lang;
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim().length > 0) {
        callbacks.onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim().length > 0) {
        callbacks.onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      const errorMsg =
        event.error === 'not-allowed'
          ? 'Permiso de micrófono denegado en el navegador.'
          : event.error === 'no-speech'
          ? 'No se detectó audio ni voz.'
          : `Error en el reconocimiento: ${event.error}`;
      callbacks.onError(errorMsg);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      callbacks.onError(`No se pudo iniciar el micrófono: ${err.message}`);
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignorar si ya estaba detenido
      }
      this.isListening = false;
    }
  }
}

export const defaultSpeechAdapter = new WebSpeechAdapter('es-BO');
