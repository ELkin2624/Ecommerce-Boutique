import { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, AlertCircle } from 'lucide-react';
import { defaultSpeechAdapter } from '@/shared/lib/speech/web-speech-adapter';
import type { SpeechAdapter } from '@/shared/lib/speech/speech-adapter';
import { Button } from '@/shared/ui/Button';

export type ReportProcessingState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'querying'
  | 'rendering'
  | 'error';

interface VoiceQueryInputProps {
  onSearch: (queryText: string) => Promise<void>;
  status: ReportProcessingState;
  errorMessage?: string | null;
  speechAdapter?: SpeechAdapter;
}

const SAMPLE_QUERIES = [
  '¿Cuáles son las prendas más vendidas en todas las sucursales este mes?',
  '¿Cuánto es el total recaudado en ventas hoy por sucursal?',
  'Top 5 categorías con mayor volumen de reservas en probador',
  '¿Qué variantes de inventario tienen stock crítico en este momento?',
];

export function VoiceQueryInput({
  onSearch,
  status,
  errorMessage,
  speechAdapter = defaultSpeechAdapter,
}: VoiceQueryInputProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const isSupported = speechAdapter.isSupported();

  useEffect(() => {
    return () => {
      if (isRecording) {
        speechAdapter.stop();
      }
    };
  }, [isRecording, speechAdapter]);

  const toggleRecording = () => {
    if (isRecording) {
      speechAdapter.stop();
      setIsRecording(false);
      return;
    }

    setSpeechError(null);
    setIsRecording(true);

    speechAdapter.start({
      onStart: () => setIsRecording(true),
      onResult: (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal) {
          setIsRecording(false);
          onSearch(transcript);
        }
      },
      onError: (err) => {
        setIsRecording(false);
        setSpeechError(err);
      },
      onEnd: () => setIsRecording(false),
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || status === 'querying') return;
    onSearch(inputText.trim());
  };

  return (
    <div className="space-y-4">
      {/* Input Container */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative flex items-center rounded-xl border-2 border-primary/20 bg-background shadow-lg focus-within:border-primary transition-all p-2 gap-2">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={!isSupported || status === 'querying'}
            className={`p-3 rounded-lg flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            } ${!isSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={
              !isSupported
                ? 'Reconocimiento de voz no disponible en este navegador'
                : isRecording
                ? 'Detener grabación de voz'
                : 'Presione para hablar en lenguaje natural'
            }
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={status === 'querying'}
            placeholder={
              isRecording
                ? 'Escuchando su consulta por micrófono...'
                : 'Consulte en lenguaje natural (ej. "¿Cuáles son las prendas más vendidas este mes?")...'
            }
            className="flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!inputText.trim() || status === 'querying'}
            isLoading={status === 'querying'}
            className="gap-2 shrink-0 px-4"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Analizar con IA</span>
          </Button>
        </div>
      </form>

      {/* Voice notice if not supported or error */}
      {!isSupported && (
        <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-amber-600" />
          <span>
            Micrófono: Este navegador no tiene activa la Web Speech API. Puede escribir su consulta en el campo de texto.
          </span>
        </p>
      )}

      {speechError && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* State Badge Status */}
      {status !== 'idle' && status !== 'error' && (
        <div className="flex items-center gap-2 text-xs text-primary font-medium py-1 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {status === 'listening' && 'Escuchando audio...'}
            {status === 'transcribing' && 'Transcribiendo audio capturado...'}
            {status === 'querying' && 'Interpretando consulta y ejecutando análisis en PostgreSQL...'}
            {status === 'rendering' && 'Generando visualización y gráficos...'}
          </span>
        </div>
      )}

      {/* Suggested Quick Queries Pills */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground block">
          Consultas sugeridas de ejemplo:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(q);
                onSearch(q);
              }}
              className="text-xs bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border px-2.5 py-1.5 rounded-full transition-all text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
