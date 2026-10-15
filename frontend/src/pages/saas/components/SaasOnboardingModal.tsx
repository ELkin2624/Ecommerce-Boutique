import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  X,
  Store,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useTenantStore } from '@/app/store/tenant.store';

interface SaasOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const SaasOnboardingModal: React.FC<SaasOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'PRO',
}) => {
  const navigate = useNavigate();
  const { setCurrentTenant, fetchTenants } = useTenantStore();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>(
    (initialPlan as any) || 'PRO',
  );
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Moda Femenina & Boutiques');
  const [primaryColor, setPrimaryColor] = useState('#1D8B94');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        plan,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        password,
        phone: phone.trim() || undefined,
        category,
        primaryColor,
      };

      const res = await axios.post(`${API_BASE}/saas/tenants/register`, payload);
      const data = res.data?.data;

      if (data?.tenant) {
        setCreatedTenant(data);
        setCurrentTenant(data.tenant);
        await fetchTenants();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error al crear el esquema de la tienda. Inténtalo con otro subdominio.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToStore = () => {
    onClose();
    navigate('/store');
    window.location.reload();
  };

  const handleGoToAdmin = () => {
    onClose();
    navigate('/admin/login');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-saas-surface border border-saas-border rounded-3xl shadow-2xl overflow-hidden my-8 text-saas-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-saas-border bg-saas-bg-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-holst-50 dark:bg-holst-900 text-holst-600 dark:text-holst-400 border border-holst-200 dark:border-holst-600/40">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-saas-text-primary">
                {createdTenant ? '¡Tienda Creada Exitosamente!' : 'Registrar mi Tienda SaaS'}
              </h3>
              <p className="text-xs text-saas-text-dim">
                Aprovisionamiento instantáneo de esquema PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-saas-text-dim hover:text-saas-text-primary hover:bg-saas-surface-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdTenant ? (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-saas-text-primary">
                  ¡Bienvenido a {createdTenant.tenant.name}!
                </h4>
                <p className="text-xs sm:text-sm text-saas-text-dim mt-2 max-w-md mx-auto leading-relaxed">
                  Tu base de datos dedicada fue aprovisionada en PostgreSQL bajo el esquema:{' '}
                  <strong className="text-holst-600 dark:text-holst-400 font-mono font-bold">
                    {createdTenant.tenant.schemaName}
                  </strong>
                  . Tus tablas de catálogo, usuarios y POS ya fueron clonadas y sembradas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-saas-bg-subtle border border-saas-border text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-saas-text-dim">Subdominio de Tienda:</span>
                  <span className="font-mono font-bold text-saas-text-primary">
                    https://{createdTenant.tenant.slug}.fashionstore.app
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-saas-text-dim">Plan Seleccionado:</span>
                  <span className="font-bold text-holst-600 dark:text-holst-400 uppercase">
                    {createdTenant.tenant.plan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-saas-text-dim">Usuario Administrador:</span>
                  <span className="font-mono text-saas-text-primary">{ownerEmail}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleGoToStore}
                  className="py-3 px-4 rounded-xl font-bold text-sm bg-holst-600 hover:bg-holst-800 text-white flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Abrir Tienda Online</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGoToAdmin}
                  className="py-3 px-4 rounded-xl font-bold text-sm border border-saas-border bg-saas-surface hover:bg-saas-surface-hover text-saas-text-primary transition"
                >
                  <span>Ir al Panel Admin</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Store Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Nombre de la Boutique *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Boutique Bella Donna"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-saas-bg border border-saas-border text-saas-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-holst-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Subdominio / Slug *
                  </label>
                  <div className="flex items-center rounded-xl bg-saas-bg border border-saas-border px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-holst-600">
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="bella-donna"
                      className="w-full bg-transparent text-saas-text-primary text-sm focus:outline-none font-mono"
                    />
                    <span className="text-xs text-saas-text-dim font-mono">.fashionstore.app</span>
                  </div>
                </div>
              </div>

              {/* Plan Picker */}
              <div>
                <label className="block text-xs font-semibold text-saas-text-secondary mb-1.5">
                  Plan Inicial (14 Días Gratis)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'STARTER', name: 'Starter', price: '$29/m' },
                    { id: 'PRO', name: 'Pro Omnicanal', price: '$79/m' },
                    { id: 'ENTERPRISE', name: 'Enterprise', price: '$199/m' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id as any)}
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        plan === p.id
                          ? 'bg-holst-50 dark:bg-holst-900 border-holst-600 text-holst-600 dark:text-holst-400 font-bold ring-2 ring-holst-600/20'
                          : 'bg-saas-bg border-saas-border text-saas-text-dim hover:border-saas-border-strong'
                      }`}
                    >
                      <div className="text-xs">{p.name}</div>
                      <div className="text-[10px] text-holst-600 dark:text-holst-400 font-semibold">{p.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Nombre del Propietario / Admin *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Valeria Rocha"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-saas-bg border border-saas-border text-saas-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-holst-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Correo Electrónico (Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="admin@belladonna.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-saas-bg border border-saas-border text-saas-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-holst-600"
                  />
                </div>
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Contraseña de Administrador *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-saas-bg border border-saas-border text-saas-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-holst-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+591 71234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-saas-bg border border-saas-border text-saas-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-holst-600"
                  />
                </div>
              </div>

              {/* Color & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Giro / Categoría Principal
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Alta Costura, Vestidos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-saas-bg border border-saas-border text-saas-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-holst-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-saas-text-secondary mb-1">
                    Color Primario de Marca
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-saas-text-dim">{primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-saas-border">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-holst-600 hover:bg-holst-800 text-white shadow-lg shadow-holst-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Provisionando esquema PostgreSQL dedicado...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Crear Tienda y Comenzar Prueba Gratis</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-saas-text-dim text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>14 días de prueba gratis en tu propio esquema. Cancela cuando quieras.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
