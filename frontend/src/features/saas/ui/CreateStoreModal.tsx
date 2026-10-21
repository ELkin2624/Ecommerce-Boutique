import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Store,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Lock,
  Plus,
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { useAuthStore } from '@/app/store/auth.store';
import { useTenantStore } from '@/app/store/tenant.store';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface CreateStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STORE_CATEGORIES = [
  'Boutique de Ropa & Moda',
  'Calzado & Marroquinería',
  'Accesorios & Joyería',
  'Ropa Deportiva & Athleisure',
  'Moda Infantil & Juvenil',
  'Alta Costura & Gala',
  'Comercio General',
];

const BRAND_COLORS = [
  { name: 'Teal Imperial', hex: '#1D8B94' },
  { name: 'Índigo Real', hex: '#4F46E5' },
  { name: 'Rosa Boutique', hex: '#E11D48' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Ámbar Urbano', hex: '#D97706' },
  { name: 'Ónix Elegante', hex: '#1E293B' },
];

function slugifyStoreName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function CreateStoreModal({ open, onOpenChange }: CreateStoreModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { planQuota, fetchMyTenants, createStoreFromPanel } = useTenantStore();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [category, setCategory] = useState(STORE_CATEGORIES[0]);
  const [phone, setPhone] = useState('');
  const [primaryColor, setPrimaryColor] = useState(BRAND_COLORS[0].hex);

  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    available: boolean | null;
    reason?: string;
  }>({ available: null });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchMyTenants();
      setName('');
      setSlug('');
      setSlugManuallyEdited(false);
      setCategory(STORE_CATEGORIES[0]);
      setPhone(user?.phone || '');
      setPrimaryColor(BRAND_COLORS[0].hex);
      setSlugStatus({ available: null });
      setErrorMsg(null);
    }
  }, [open, fetchMyTenants, user?.phone]);

  // Auto-generar slug cuando cambia el nombre si no fue editado manualmente
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugifyStoreName(name));
    }
  }, [name, slugManuallyEdited]);

  // Verificar disponibilidad del subdominio en tiempo real con debounce
  useEffect(() => {
    if (!open) return;
    const clean = slugifyStoreName(slug);
    if (!clean || clean.length < 3) {
      setSlugStatus({
        available: clean.length > 0 ? false : null,
        reason: clean.length > 0 ? 'El subdominio debe tener al menos 3 caracteres.' : undefined,
      });
      return;
    }

    let cancelled = false;
    setIsCheckingSlug(true);

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/saas/domains/check/${clean}`);
        const data = res.data?.data || res.data;
        if (!cancelled) {
          setSlugStatus({
            available: Boolean(data?.available),
            reason: data?.reason,
          });
        }
      } catch {
        if (!cancelled) {
          setSlugStatus({ available: null });
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSlug(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, open]);

  if (!open) return null;

  const limitReached = planQuota ? !planQuota.canCreateMore : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSlug = slugifyStoreName(slug);
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Por favor ingresa un nombre comercial válido para la tienda.');
      return;
    }
    if (!cleanSlug || cleanSlug.length < 3) {
      setErrorMsg('El subdominio debe tener entre 3 y 50 caracteres alfanuméricos o guiones.');
      return;
    }
    if (slugStatus.available === false) {
      setErrorMsg(slugStatus.reason || 'El subdominio elegido no está disponible.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStoreFromPanel(
        {
          name: name.trim(),
          slug: cleanSlug,
          category,
          phone: phone.trim() || undefined,
          primaryColor,
        },
        true,
      );

      toast.success(
        `¡Tienda "${result.tenant.name}" creada con éxito!`,
        `Esquema aislado listo y sin datos precreados (${result.tenant.slug}.fashionstore.com).`,
      );
      onOpenChange(false);
      navigate('/dashboard');
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo crear la nueva tienda. Verifica las restricciones de tu plan.';
      const formattedMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : String(backendMessage);
      setErrorMsg(formattedMessage);
      toast.error('No se pudo crear la tienda', formattedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 pb-4 border-b shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Crear Nueva Tienda
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3" /> Multi-Tenant
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Aprovisiona una tienda independiente bajo tu misma cuenta global ({user?.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Resumen del Plan y Cupo de Tiendas */}
            {planQuota && (
              <div
                className={`rounded-xl border p-3.5 transition-colors ${
                  limitReached
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-primary/20 bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {limitReached ? (
                      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="text-xs font-bold text-foreground">
                      Plan activo: {planQuota.planName} ({planQuota.effectivePlan})
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      limitReached
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {planQuota.ownedCount} de {planQuota.maxStores}{' '}
                    {planQuota.maxStores === 1 ? 'tienda utilizada' : 'tiendas utilizadas'}
                  </span>
                </div>

                {/* Barra de progreso de cupo */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      limitReached ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((planQuota.ownedCount / Math.max(1, planQuota.maxStores)) * 100),
                      )}%`,
                    }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {limitReached ? (
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      Has alcanzado el límite máximo de {planQuota.maxStores}{' '}
                      {planQuota.maxStores === 1 ? 'tienda permitida' : 'tiendas permitidas'} en tu
                      plan <strong>{planQuota.planName}</strong>. Cupos por plan: Starter (1), Pro
                      (3), Enterprise (10).
                    </span>
                  ) : (
                    <>
                      Tienes <strong>{planQuota.remainingStores}</strong>{' '}
                      {planQuota.remainingStores === 1
                        ? 'cupo disponible'
                        : 'cupos disponibles'}{' '}
                      en tu plan actual. La nueva tienda se creará en su propio esquema PostgreSQL
                      completamente limpio (0 sucursales, 0 almacenes, 0 POS y 0 productos precreados).
                    </>
                  )}
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2.5 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Nombre Comercial */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Nombre comercial de la nueva tienda *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Marca de Zapatos Exclusivos"
                className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>

            {/* Subdominio / Slug con validación en tiempo real */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Subdominio / Identificador único (Slug) *
                </label>
                {isCheckingSlug && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidad...
                  </span>
                )}
                {!isCheckingSlug && slugStatus.available === true && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Subdominio disponible
                  </span>
                )}
                {!isCheckingSlug && slugStatus.available === false && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> No disponible
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                <div className="pl-3 pr-1.5 text-muted-foreground flex items-center">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(slugifyStoreName(e.target.value));
                  }}
                  placeholder="zapatos-exclusivos"
                  className="flex-1 h-9 bg-transparent px-1.5 py-1 text-xs font-mono focus:outline-none"
                />
                <span className="bg-muted px-3 h-9 flex items-center text-[11px] font-mono text-muted-foreground border-l border-border">
                  .fashionstore.com
                </span>
              </div>
              {slugStatus.available === false && slugStatus.reason && (
                <p className="mt-1 text-[11px] text-destructive font-medium">{slugStatus.reason}</p>
              )}
            </div>

            {/* Categoría / Rubro y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Rubro / Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {STORE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Teléfono de contacto (Opcional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+591 70000000"
                  className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Color de Identidad de Marca */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Color distintivo de la tienda
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setPrimaryColor(c.hex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                      primaryColor === c.hex
                        ? 'border-foreground bg-muted font-semibold shadow-sm scale-[1.02]'
                        : 'border-border hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pie del modal */}
          <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Propietario: <strong>{user?.email}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isCheckingSlug || slugStatus.available === false}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Aprovisionando...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Crear Nueva Tienda
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
