import React, { useState, useEffect } from 'react';
import {
  Check, Globe, ExternalLink, Copy, UploadCloud, Palette, Phone,
  MapPin, Megaphone, Sparkles, Loader2, Lock,
} from 'lucide-react';
import { useTenantStore } from '@/app/store/tenant.store';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';
import { AppLogo } from '@/shared/ui/AppLogo';

const STORE_CATEGORIES = [
  'Boutique de Ropa Femenina',
  'Calzado & Marroquinería',
  'Moda Urbana / Streetwear',
  'Alta Costura & Ropa de Gala',
  'Ropa Masculina & Sastrería',
  'Ropa Deportiva & Athleisure',
  'Moda Infantil & Bebés',
  'Boutique Multimarca & Concept Store',
];

const PRESET_COLORS = [
  { name: 'Turquesa Boutique', hex: '#1D8B94' },
  { name: 'Rosa Fucsia', hex: '#ec4899' },
  { name: 'Índigo Real', hex: '#6366f1' },
  { name: 'Azul Océano', hex: '#0284c7' },
  { name: 'Esmeralda Lujo', hex: '#059669' },
  { name: 'Ámbar Dorado', hex: '#d97706' },
  { name: 'Negro Obsidian', hex: '#18181b' },
];

export function StoreSettingsTab() {
  const { currentTenant, updateStoreProfile } = useTenantStore();

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1D8B94');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(STORE_CATEGORIES[0]);
  const [tagline, setTagline] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Inicializar formulario con datos de la tienda activa
  useEffect(() => {
    if (currentTenant) {
      setName(currentTenant.name || '');
      setLogoUrl(currentTenant.logoUrl || '');
      setPrimaryColor(currentTenant.primaryColor || '#1D8B94');
      setPhone(currentTenant.phone || '');
      setCategory(currentTenant.category || currentTenant.settings?.category || STORE_CATEGORIES[0]);
      setTagline(currentTenant.settings?.tagline || '');
      setAnnouncement(
        (currentTenant.settings as any)?.announcement ||
          (currentTenant.settings as any)?.storefront?.announcement ||
          '',
      );
      setAddress(
        (currentTenant.settings as any)?.address ||
          (currentTenant.settings as any)?.storefront?.contact?.address ||
          '',
      );
    }
  }, [currentTenant]);

  const handleCopyStoreUrl = () => {
    if (!currentTenant?.slug) return;
    const url = `${window.location.origin}/store?tenant=${currentTenant.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Enlace copiado', 'URL de tu tienda online lista para compartir.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nombre requerido', 'El nombre comercial de la tienda no puede estar vacío.');
      return;
    }

    setIsSaving(true);
    try {
      await updateStoreProfile({
        name: name.trim(),
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        phone: phone.trim() || undefined,
        category,
        tagline: tagline.trim() || undefined,
        announcement: announcement.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast.success(
        '¡Tienda actualizada con éxito!',
        `Los cambios en "${name.trim()}" ya están activos en el panel y en la tienda online.`,
      );
    } catch (err: any) {
      toast.error(
        'Error al guardar configuración',
        err?.response?.data?.message || err?.message || 'Inténtalo de nuevo.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentTenant) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No hay una tienda activa seleccionada actualmente.
      </div>
    );
  }

  const storeDomain = `${currentTenant.slug}.fashionstore.com`;

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-50 duration-150">
      {/* 1. Tarjeta de Identidad y Subdominio */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppLogo
              size="md"
              title={name || currentTenant.name}
              logoUrl={logoUrl || currentTenant.logoUrl}
              primaryColor={primaryColor}
              useMonogram={true}
              withContainer={true}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">{name || currentTenant.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  Plan {currentTenant.plan}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground/70" />
                <span>{storeDomain}</span>
              </p>
            </div>
          </div>

          {/* Acciones de Enlace */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyStoreUrl}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar enlace directo de tu tienda"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar link'}</span>
            </button>
            <a
              href={`/store?tenant=${currentTenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Subdominio fijo informativo */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-card/60 p-2.5 rounded-xl border border-border/60">
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            El subdominio <strong className="text-foreground">{currentTenant.slug}</strong> y su esquema PostgreSQL aislado se mantienen seguros. Puedes cambiar el nombre comercial y diseño libremente.
          </span>
        </div>
      </div>

      {/* 2. Nombre Comercial y Rubro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Nombre Comercial de la Tienda</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Zapatería Zapatin & Calzados"
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <p className="text-[10px] text-muted-foreground">
            Aparece en el menú, en la tienda online y en las facturas de caja.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Rubro / Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground">
            Adapta la apariencia editorial y filtros de tu storefront.
          </p>
        </div>
      </div>

      {/* 3. Logo & Identidad de Marca */}
      <div className="space-y-3 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UploadCloud className="h-3.5 w-3.5 text-primary" />
            <span>Logo de la Tienda</span>
          </label>
          <span className="text-[10px] text-muted-foreground">
            {logoUrl ? 'Logo personalizado activo' : 'Usando monograma con color de marca'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Pega la URL de tu logo (SVG, PNG, JPG, WebP) o déjalo vacío para usar el monograma"
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          {logoUrl && (
            <button
              type="button"
              onClick={() => setLogoUrl('')}
              className="h-10 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      {/* 4. Color de Marca (Primary Color) */}
      <div className="space-y-3 pt-1 border-t border-border/60">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span>Color de Marca & Acentos</span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => {
            const isSelected = primaryColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setPrimaryColor(preset.hex)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-foreground shadow-sm bg-muted text-foreground'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: preset.hex }}
                />
                <span>{preset.name}</span>
                {isSelected && <Check className="h-3 w-3 text-foreground ml-0.5" />}
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 pl-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
              title="Elegir color personalizado"
            />
            <span className="text-xs font-mono font-medium uppercase text-muted-foreground">
              {primaryColor}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Personalización del Storefront (/store) */}
      <div className="space-y-4 pt-1 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Personalización de la Tienda Online (/store)
          </h4>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Slogan o Manifiesto de Marca</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ej: Calzado exclusivo confeccionado para tu estilo de vida."
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-amber-500" />
              <span>Barra de Anuncios Destacada</span>
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Ej: ¡Envíos gratis en compras mayores a Bs 200 en toda Bolivia!"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp de Atención al Cliente</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+591 70012345"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                <span>Dirección Física de la Boutique</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. San Martín #450, Santa Cruz"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Botón de Guardar Cambios */}
      <div className="pt-4 border-t border-border flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="rounded-xl px-6 h-10 text-xs font-bold flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span>Guardar Configuración de Tienda</span>
        </Button>
      </div>
    </form>
  );
}
