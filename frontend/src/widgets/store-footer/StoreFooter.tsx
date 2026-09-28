import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin, Clock, Lock, ArrowUpRight } from 'lucide-react';
import { BRAND_CONFIG } from '@/shared/config/brand.config';
import { AppLogo } from '@/shared/ui/AppLogo';

export function StoreFooter() {
  const whatsappUrl = `https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Hola Boutique Kitty, deseo información sobre las prendas y disponibilidad en tienda.'
  )}`;

  return (
    <footer id="contacto" className="border-t border-border bg-foreground text-background mt-20 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Encabezado Principal / Wordmark Augen-Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-background/20">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AppLogo size="sm" showText={false} className="brightness-125" />
              <span className="font-extrabold text-2xl sm:text-3xl tracking-tighter uppercase font-mono">
                {BRAND_CONFIG.name}
              </span>
            </div>
            <p className="text-xs text-background/70 max-w-md leading-relaxed">
              {BRAND_CONFIG.storeDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background text-foreground font-mono text-xs font-bold uppercase hover:bg-primary hover:text-primary-foreground transition-all shadow-md active:scale-95"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>WhatsApp Directo</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </a>

            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-background/20 text-background/80 hover:text-background hover:bg-background/10 font-mono text-xs transition-colors"
            >
              <Lock className="h-3 w-3" />
              <span>[ Acceso POS ]</span>
            </Link>
          </div>
        </div>

        {/* Columnas Numeradas Augen-Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Columna 01: Navegación */}
          <div className="space-y-3">
            <span className="font-mono text-[11px] font-bold text-background/50 uppercase tracking-widest block">
              [ 01 / NAVEGACIÓN ]
            </span>
            <ul className="space-y-2.5 text-background/80 font-medium">
              <li>
                <Link to="/" className="hover:text-primary transition-colors flex items-center justify-between">
                  <span>Catálogo de Prendas</span>
                  <ArrowUpRight className="h-3 w-3 opacity-40" />
                </Link>
              </li>
              <li>
                <a href="#destacados" className="hover:text-primary transition-colors flex items-center justify-between">
                  <span>Colección Destacada</span>
                  <ArrowUpRight className="h-3 w-3 opacity-40" />
                </a>
              </li>
              <li>
                <a href="#probador-ar" className="hover:text-primary transition-colors flex items-center justify-between">
                  <span>Probador Virtual AR</span>
                  <ArrowUpRight className="h-3 w-3 opacity-40" />
                </a>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary transition-colors flex items-center justify-between">
                  <span>Bolsa de Compras</span>
                  <ArrowUpRight className="h-3 w-3 opacity-40" />
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary transition-colors flex items-center justify-between">
                  <span>Mis Pedidos & Rastreo</span>
                  <ArrowUpRight className="h-3 w-3 opacity-40" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 02: Sucursales y Ubicaciones */}
          <div className="space-y-3">
            <span className="font-mono text-[11px] font-bold text-background/50 uppercase tracking-widest block">
              [ 02 / SUCURSALES ]
            </span>
            <ul className="space-y-3 text-background/80">
              <li className="space-y-1">
                <p className="font-bold text-background">Sucursal Equipetrol (Principal)</p>
                <p className="text-[11px] text-background/60 leading-relaxed flex items-start gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                  <span>{BRAND_CONFIG.contact.address}</span>
                </p>
              </li>
              <li className="space-y-1 pt-1 border-t border-background/10">
                <p className="font-bold text-background">Envíos Nacionales</p>
                <p className="text-[11px] text-background/60">
                  Santa Cruz · La Paz · Cochabamba · Sucre · Tarija · Oruro · Potosí
                </p>
              </li>
            </ul>
          </div>

          {/* Columna 03: Atención al Cliente */}
          <div className="space-y-3">
            <span className="font-mono text-[11px] font-bold text-background/50 uppercase tracking-widest block">
              [ 03 / ATENCIÓN ]
            </span>
            <ul className="space-y-2.5 text-background/80">
              <li className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{BRAND_CONFIG.contact.schedule}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>{BRAND_CONFIG.contact.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>{BRAND_CONFIG.contact.whatsapp}</span>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Garantía de cambio en 7 días</span>
              </li>
            </ul>
          </div>

          {/* Columna 04: Formas de Pago & Seguridad */}
          <div className="space-y-3">
            <span className="font-mono text-[11px] font-bold text-background/50 uppercase tracking-widest block">
              [ 04 / SEGURIDAD ]
            </span>
            <div className="space-y-2 text-background/70 leading-relaxed">
              <p>
                Plataforma con encriptación SSL y pasarela de pago instantáneo con QR Simple BCP, BNB, Ganadero y Mercantil Santa Cruz.
              </p>
              <div className="p-3 rounded-xl bg-background/5 border border-background/10 text-[11px] font-mono text-background/80">
                ✓ Comprobante digital inmediato
              </div>
            </div>
          </div>
        </div>

        {/* Footer Inferior / Copyright */}
        <div className="pt-8 border-t border-background/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-background/50">
          <p>© {new Date().getFullYear()} {BRAND_CONFIG.legalName} · Todos los derechos reservados.</p>
          <div className="flex items-center gap-3">
            <span>BOUTIQUE KITTY STUDIO</span>
            <span>•</span>
            <span className="text-primary">{BRAND_CONFIG.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
