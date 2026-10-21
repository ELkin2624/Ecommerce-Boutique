import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Loader2,
  ChevronRight,
  KeyRound,
  AlertCircle,
  Check,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/app/store/auth.store';
import { useTenantStore } from '@/app/store/tenant.store';
import { toast, Toaster } from '@/shared/ui/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

type AuthStep =
  | 'LOOKUP' // Step 1: Email lookup
  | 'PASSWORD_ENTRY' // Step 2: Password entry for existing account (MANDATORY & SECURE)
  | 'STORE_PICKER' // Step 3: Store Selector for multi-store merchants
  | 'CREATE_STORE_FOR_USER' // Step 3-B: Existing user creates an additional store (under plan limit)
  | 'SIGNUP_ACCOUNT' // Step 2-New: First name, last name, password for new merchant
  | 'SIGNUP_STORE' // Step 3-New: Store name, subdomain, category, plan
  | 'PROVISIONING'; // Provisioning animation

const STORE_CATEGORIES = [
  'Boutique de Ropa Femenina',
  'Moda Urbana / Streetwear',
  'Alta Costura & Ropa de Gala',
  'Calzado & Accesorios de Cuero',
  'Ropa Masculina & Sastrería',
  'Ropa Deportiva & Athleisure',
  'Moda Infantil & Bebés',
  'Boutique Multimarca & Concept Store',
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuthStore();
  const { setCurrentTenant, fetchTenants } = useTenantStore();

  // Navigation & Step State
  const [step, setStep] = useState<AuthStep>('LOOKUP');
  const [email, setEmail] = useState('');
  const [lastUsedEmail, setLastUsedEmail] = useState<string | null>(null);

  // Authentication & Password State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null);
  const [userTenants, setUserTenants] = useState<any[]>([]);

  // New Merchant Account & Store Setup State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(STORE_CATEGORIES[0]);
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [primaryColor] = useState('#1D8B94');

  // Async & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Restore last used email if present
  useEffect(() => {
    const savedEmail = localStorage.getItem('fashionstore_last_email');
    if (savedEmail) {
      setLastUsedEmail(savedEmail);
      setEmail(savedEmail);
    }
  }, []);

  // Real-time slug availability check when slug changes
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const res = await axios.get(`${API_BASE}/saas/domains/check/${slug}`);
        const data = res.data?.data ?? res.data;
        setSlugAvailable(Boolean(data?.available));
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  // ---------------------------------------------------------------------------
  // STEP 1: Universal Email Lookup (Check whether account exists)
  // ---------------------------------------------------------------------------
  const handleLookupEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/saas/auth/lookup`, { email: cleanEmail });
      const data = res.data?.data;

      // Save email as last used
      localStorage.setItem('fashionstore_last_email', cleanEmail);
      setLastUsedEmail(cleanEmail);

      if (data?.exists) {
        // Account exists -> MUST PROMPT PASSWORD FOR SECURITY
        setPassword('');
        setStep('PASSWORD_ENTRY');
      } else {
        // Account does not exist -> Go to Registration
        setStep('SIGNUP_ACCOUNT');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al verificar la cuenta. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2: Password Authentication (Verifies Argon2 Hash Before Access)
  // ---------------------------------------------------------------------------
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/saas/auth/verify-login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = res.data?.data;
      if (!data?.verified) {
        setError('Contraseña incorrecta. Por favor verifica tus credenciales.');
        return;
      }

      setAuthenticatedUser(data.user);
      setUserTenants(data.tenants || []);

      // If user owns only 1 store -> Log in directly without extra clicks
      if (data.tenants && data.tenants.length === 1) {
        const singleStore = data.tenants[0];
        await executeStoreSession(singleStore);
        return;
      }

      // If user owns multiple stores -> Show Store Picker
      if (data.tenants && data.tenants.length > 1) {
        setStep('STORE_PICKER');
        return;
      }

      // If account exists but no active store yet -> Prompt store creation
      setStep('CREATE_STORE_FOR_USER');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Contraseña incorrecta. Por favor verifica tus credenciales.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to establish session for a selected store
  const executeStoreSession = async (store: any) => {
    try {
      // Login into the tenant's specific schema
      const loginRes = await axios.post(
        `${API_BASE}/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: {
            'x-tenant-slug': store.slug,
          },
        },
      );

      const { user, accessToken, refreshToken } = loginRes.data;

      // Set active tenant in store & localStorage
      localStorage.setItem('fashionstore_tenant_slug', store.slug);
      setCurrentTenant(store);

      // Set auth store session
      setSession({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isActive: user.isActive,
          roles: user.roles || [],
          permissions: user.permissions || [],
        },
        accessToken,
        refreshToken,
      });

      toast.success(
        `Acceso autorizado a ${store.name}`,
        `Bienvenido(a), ${user.firstName}. Esquema PostgreSQL aislado activo.`,
      );

      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Error al iniciar sesión en el esquema de esta tienda.',
      );
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 3: Store Selection (for merchants with multiple stores)
  // ---------------------------------------------------------------------------
  const handleSelectStoreFromPicker = async (store: any) => {
    setError(null);
    setIsLoading(true);
    await executeStoreSession(store);
    setIsLoading(false);
  };

  // ---------------------------------------------------------------------------
  // STEP 3-B: Create Additional Store for Existing User
  // ---------------------------------------------------------------------------
  const handleStartCreateStoreForExistingUser = () => {
    setStoreName('');
    setSlug('');
    setCategory(STORE_CATEGORIES[0]);
    setSelectedPlan('PRO');
    setError(null);
    setStep('CREATE_STORE_FOR_USER');
  };

  const handleCreateAdditionalStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanSlug = slug.trim().toLowerCase();
      const payload = {
        name: storeName.trim(),
        slug: cleanSlug,
        plan: selectedPlan,
        ownerName: authenticatedUser
          ? `${authenticatedUser.firstName} ${authenticatedUser.lastName}`
          : 'Administrador',
        ownerEmail: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        category,
        primaryColor,
      };

      const res = await axios.post(`${API_BASE}/saas/tenants/register`, payload);
      const data = res.data?.data;

      if (data?.tenant) {
        localStorage.setItem('fashionstore_tenant_slug', data.tenant.slug);
        setCurrentTenant(data.tenant);
        await fetchTenants();

        toast.success(
          'Nueva tienda creada exitosamente',
          `Esquema PostgreSQL dedicado aprovisionado para "${data.tenant.name}".`,
        );

        // Immediately log in into the newly created store
        await executeStoreSession(data.tenant);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Error al crear la tienda. Verifica que el subdominio esté disponible.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // NEW MERCHANT: Register Account & Launch First Store
  // ---------------------------------------------------------------------------
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setSlug(autoSlug);
  };

  const handleCompleteAccountAndStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeName.trim() || !slug.trim()) {
      setError('Por favor completa el nombre de tu tienda y confirma el subdominio.');
      return;
    }

    if (slugAvailable === false) {
      setError(`El subdominio "${slug}" ya está en uso. Por favor elige otro.`);
      return;
    }

    setStep('PROVISIONING');
    setIsLoading(true);

    try {
      const cleanSlug = slug.trim().toLowerCase();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Administrador';

      const payload = {
        name: storeName.trim(),
        slug: cleanSlug,
        plan: selectedPlan,
        ownerName: fullName,
        ownerEmail: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        category,
        primaryColor,
      };

      const res = await axios.post(`${API_BASE}/saas/tenants/register`, payload);
      const data = res.data?.data;

      if (data?.tenant) {
        localStorage.setItem('fashionstore_tenant_slug', data.tenant.slug);
        localStorage.setItem('fashionstore_last_email', email.trim().toLowerCase());
        setCurrentTenant(data.tenant);
        await fetchTenants();

        // Auto login into newly created store
        await executeStoreSession(data.tenant);
      }
    } catch (err: any) {
      setStep('SIGNUP_STORE');
      setError(
        err.response?.data?.message ||
          'Error al aprovisionar la tienda en PostgreSQL. Inténtalo de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#04222B] text-white selection:bg-holst-600 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-holst-600/15 via-holst-900/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar with Brand & Back to Home */}
      <header className="w-full px-6 py-6 flex items-center justify-between relative z-10">
        <Link
          to="/"
          className="flex items-center gap-2.5 group transition-transform hover:scale-102"
        >
          <img
            src="/logo/logo-fashion.jpg"
            alt="FashionStore Logo"
            className="w-9 h-9 object-contain rounded-xl shadow-md"
          />
          <span className="text-xl font-black tracking-tight text-white">
            Fashion<span className="text-holst-400">Store</span>
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-holst-200 hover:text-white transition-colors bg-holst-900/60 px-3 py-1.5 rounded-xl border border-holst-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </Link>
      </header>

      {/* Main Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[480px]">
          {/* ================================================================= */}
          {/* STEP 1: Universal Email Lookup (Screenshot 1)                     */}
          {/* ================================================================= */}
          {step === 'LOOKUP' && (
            <div className="bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                  Log in
                </h1>
                <p className="mt-1 text-sm text-gray-500 font-medium">
                  Continuar a FashionStore
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLookupEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Email</label>
                    {lastUsedEmail && email === lastUsedEmail && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        Último usado
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      autoFocus
                      required
                      placeholder="nombre@tutienda.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full h-12 px-3.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-medium transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Continuar con email</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-bold">o</span>
                </div>
              </div>

              {/* Passkey & Social Mock Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => toast.info('Función de Passkey', 'Disponible en producción con WebAuthn.')}
                  className="w-full h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-gray-600" />
                  <span>Iniciar sesión con passkey</span>
                </button>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    title="Google"
                    onClick={() => toast.info('Acceso con Google', 'Disponible próximamente.')}
                    className="h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs transition-colors"
                  >
                    <span className="text-red-500 font-black">G</span>
                  </button>
                  <button
                    type="button"
                    title="Apple"
                    onClick={() => toast.info('Acceso con Apple', 'Disponible próximamente.')}
                    className="h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs transition-colors text-black"
                  >
                    🍎
                  </button>
                  <button
                    type="button"
                    title="Facebook"
                    onClick={() => toast.info('Acceso con Facebook', 'Disponible próximamente.')}
                    className="h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-blue-600 transition-colors"
                  >
                    f
                  </button>
                  <button
                    type="button"
                    title="WhatsApp"
                    onClick={() => toast.info('Acceso con WhatsApp', 'Disponible próximamente.')}
                    className="h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-emerald-600 transition-colors"
                  >
                    💬
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-5 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  ¿Eres nuevo en FashionStore?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('SIGNUP_ACCOUNT')}
                    className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1"
                  >
                    <span>Empezar gratis</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: Password Entry (MANDATORY & SECURE)                       */}
          {/* ================================================================= */}
          {step === 'PASSWORD_ENTRY' && (
            <div className="bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              {/* Email Chip with Change button */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 mb-6">
                <div className="truncate">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Cuenta FashionStore
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('LOOKUP')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                >
                  Cambiar
                </button>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900">Ingresa tu contraseña</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Protegido con encriptación Argon2 y verificación estricta.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Contraseña</label>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info(
                          'Recuperación de Contraseña',
                          'Usa tu contraseña maestra de administrador para este demo.',
                        )
                      }
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full h-12 px-3.5 pr-11 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-medium transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autenticación Criptográfica Segura</span>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: Store Picker (ONLY AFTER PASSWORD VERIFICATION)           */}
          {/* ================================================================= */}
          {step === 'STORE_PICKER' && (
            <div className="bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                    Tus tiendas
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Sesión verificada para <span className="font-bold text-gray-800">{email}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('LOOKUP');
                    setPassword('');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Cerrar
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Selecciona la tienda para ingresar al panel:
              </p>

              {/* List of User's Stores */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {userTenants.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectStoreFromPicker(t)}
                    className="p-3.5 rounded-2xl border border-gray-200 hover:border-holst-600 hover:bg-holst-50/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                        style={{ backgroundColor: t.primaryColor || '#1D8B94' }}
                      >
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900 group-hover:text-holst-800 transition-colors">
                            {t.name}
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {t.plan}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>{t.domain || `${t.slug}.fashionstore.com`}</span>
                        </p>
                        <span className="text-[11px] text-holst-700 font-medium">
                          {t.category || 'Boutique de Moda'}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-holst-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>

              {/* Add Store Button (respecting plan limits) */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleStartCreateStoreForExistingUser}
                  className="w-full h-11 rounded-xl border border-dashed border-gray-300 hover:border-holst-600 hover:bg-holst-50 text-gray-700 hover:text-holst-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear otra tienda para esta cuenta</span>
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Límite según tu plan: Starter (1), Pro (3), Enterprise (10)
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3-B: Create Additional Store for Existing User               */}
          {/* ================================================================= */}
          {step === 'CREATE_STORE_FOR_USER' && (
            <div className="bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setStep('STORE_PICKER')}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a mis tiendas</span>
              </button>

              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Añadir nueva tienda
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Se creará un nuevo esquema aislado asociado a {email}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateAdditionalStore} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nombre de la Boutique</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Urban Streetwear"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-holst-600 focus:ring-2 focus:ring-holst-600/20 text-sm font-medium transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Dominio de la Tienda</label>
                  <div className="flex items-center rounded-xl border border-gray-300 bg-gray-50 overflow-hidden px-3 h-11">
                    <span className="text-xs font-semibold text-gray-400">https://</span>
                    <input
                      type="text"
                      required
                      placeholder="urban-streetwear"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-transparent px-1.5 text-xs font-bold text-gray-900 outline-none"
                    />
                    <span className="text-xs font-semibold text-gray-500">.fashionstore.com</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Rubro o Especialidad</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-800 outline-none"
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-holst-600 hover:bg-holst-700 active:bg-holst-800 text-white font-bold text-sm transition-all shadow-md shadow-holst-600/25 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Crear Tienda y Aprovisionar Esquema</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2-New: New Merchant Credentials (Screenshot 2)               */}
          {/* ================================================================= */}
          {step === 'SIGNUP_ACCOUNT' && (
            <div className="bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              {/* Top active email badge with "Change" button */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 mb-6">
                <div>
                  <p className="text-[11px] font-bold text-gray-400">Dirección de correo</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('LOOKUP')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900">Crear tu cuenta</h1>
                <p className="text-xs text-gray-500 mt-1">
                  14 días de prueba gratuita. Sin contratos ni compromisos.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (password.length < 6) {
                    setError('La contraseña debe tener al menos 6 caracteres.');
                    return;
                  }
                  setError(null);
                  setStep('SIGNUP_STORE');
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Nombre</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-medium outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Apellido</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Crear una contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 pr-11 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  <div className="pt-1.5 flex items-center gap-1.5">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        password.length === 0
                          ? 'bg-gray-200'
                          : password.length < 6
                          ? 'bg-red-400'
                          : password.length < 9
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        password.length < 6
                          ? 'bg-gray-200'
                          : password.length < 9
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        password.length < 9 ? 'bg-gray-200' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">Debe tener al menos 8 caracteres.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Teléfono / WhatsApp <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+591 70000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm font-medium outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                >
                  <span>Continuar a los detalles de tu tienda</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3-New: Store Details & Subdomain Setup                       */}
          {/* ================================================================= */}
          {step === 'SIGNUP_STORE' && (
            <div className="bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setStep('SIGNUP_ACCOUNT')}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a mis datos</span>
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">Configura tu tienda</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Define el nombre y el subdominio con el que accederán tus clientes.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCompleteAccountAndStore} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nombre de tu Boutique</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="ej. Tienda Bella, Boutique Glamour"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-holst-600 focus:ring-2 focus:ring-holst-600/20 text-sm font-medium outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Dominio Web de tu Tienda</label>
                    {checkingSlug ? (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                      </span>
                    ) : slugAvailable === true ? (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Disponible
                      </span>
                    ) : slugAvailable === false ? (
                      <span className="text-[11px] text-red-500 font-bold">No disponible</span>
                    ) : null}
                  </div>

                  <div className="flex items-center rounded-xl border border-gray-300 bg-gray-50 overflow-hidden px-3 h-11 focus-within:border-holst-600 focus-within:ring-2 focus-within:ring-holst-600/20">
                    <span className="text-xs font-semibold text-gray-400">https://</span>
                    <input
                      type="text"
                      required
                      placeholder="tienda1"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-transparent px-1.5 text-xs font-bold text-gray-900 outline-none"
                    />
                    <span className="text-xs font-bold text-holst-700 shrink-0">.fashionstore.com</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Tus clientes visitarán este subdominio para ver tu catálogo y comprar.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Rubro o Especialidad</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-800 outline-none"
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-gray-700">Plan de Prueba (14 días gratis)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STARTER', 'PRO', 'ENTERPRISE'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPlan(p)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          selectedPlan === p
                            ? 'border-holst-600 bg-holst-50 text-holst-900 font-bold shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 text-xs font-semibold'
                        }`}
                      >
                        <p className="text-xs font-black uppercase">{p}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {p === 'STARTER' ? '$29/m' : p === 'PRO' ? '$79/m' : '$299/m'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || slugAvailable === false}
                  className="w-full h-12 rounded-xl bg-holst-600 hover:bg-holst-700 active:bg-holst-800 text-white font-bold text-sm transition-all shadow-md shadow-holst-600/25 flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Lanzar mi Tienda y Entrar al Panel</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: Automated Provisioning Loading                            */}
          {/* ================================================================= */}
          {step === 'PROVISIONING' && (
            <div className="bg-white text-gray-900 rounded-3xl p-10 text-center shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-holst-50 border border-holst-200 flex items-center justify-center mx-auto mb-5 text-holst-600 animate-bounce">
                <Store className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Aprovisionando tu Tienda Multitenant...
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                Creando tu esquema PostgreSQL aislado, tablas de inventario, catálogo base y cuenta de administrador.
              </p>

              <div className="mt-8 space-y-2 text-xs font-semibold text-gray-600 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Esquema PostgreSQL `tenant_{slug.replace(/-/g, '_')}` creado</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Catálogo de alta costura y variantes listas</span>
                </div>
                <div className="flex items-center gap-2 text-holst-600 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configurando subdominio {slug}.fashionstore.com...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global Footer Security Note */}
      <footer className="w-full py-4 text-center text-xs text-holst-300/80 relative z-10 border-t border-holst-900/60 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>FashionStore Identity • Autenticación Argon2 y Aislamiento por Esquema PostgreSQL</span>
      </footer>

      <Toaster />
    </div>
  );
}
export default LoginPage;
