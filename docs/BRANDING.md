# 🎨 Sistema Unificado de Personalización y Marca (Branding & Logo)

Este documento detalla la arquitectura implementada para la personalización de marca y el logo **Kitty** tanto en la plataforma **Web (Frontend)** como en la aplicación **Móvil (Expo / React Native)**.

---

## 📌 1. Principio de Diseño: Single Source of Truth

Anteriormente, los logos, íconos y nombres de marca estaban dispersos, hardcodeados con íconos genéricos (`<Store />`) y rutas sueltas.

Ahora, el sistema está **centralizado y desacoplado**:
1. **Configuración Central (`brand.config.ts`)**: Los nombres, subtítulos y rutas del logo se configuran en un único archivo por plataforma.
2. **Componente Reutilizable (`<AppLogo />`)**: Toda la interfaz consume este componente unificado con soporte para tamaños (`xs`, `sm`, `md`, `lg`, `xl`), contenedor con relieve, textos opcionales y layouts vertical/horizontal.
3. **Sincronización de Assets**: El logo oficial **Kitty** (`kitty.png`, `kitty.svg`, `kitty.webp`) se encuentra estandarizado en ambas aplicaciones.

---

## 📂 2. Ubicación de los Assets

### 📱 Móvil (`movil`)
| Ruta | Descripción |
| :--- | :--- |
| `movil/assets/expo.icon/kitty.png` | Imagen PNG en alta resolución (1023x970). |
| `movil/assets/expo.icon/kitty.svg` | Vectorial SVG original. |
| `movil/assets/brand/logo.png` | Enlace canónico optimizado para la app móvil. |
| `movil/assets/images/icon.png` | Ícono oficial de la aplicación móvil (Expo). |
| `movil/assets/images/splash-icon.png` | Ícono de la pantalla de bienvenida (Splash screen). |
| `movil/assets/images/android-icon-foreground.png` | Ícono adaptativo para Android. |

### 💻 Web Frontend (`frontend`)
| Ruta | Descripción |
| :--- | :--- |
| `frontend/public/kitty.svg` | Vectorial SVG servido estáticamente. |
| `frontend/public/kitty.png` | Imagen PNG en alta resolución. |
| `frontend/public/favicon.svg` | Favicon oficial de la pestaña del navegador (sustituyó el logo de Vite). |
| `frontend/public/logo.svg` / `logo.png` | Alias estandarizados para integraciones externas. |

---

## ⚙️ 3. Configuración Centralizada

### En Frontend: [`frontend/src/shared/config/brand.config.ts`](file:///c:/Parcial-si2/frontend/src/shared/config/brand.config.ts)
```typescript
export const BRAND_CONFIG = {
  name: 'Boutique Kitty',
  shortName: 'Kitty',
  legalName: 'BOUTIQUE KITTY S.R.L.',
  subtitle: 'Panel Administrativo & POS',
  tagline: 'Sistema de Gestión Omnicanal & POS',
  version: 'v2.1',
  logo: {
    svg: '/kitty.svg',
    png: '/kitty.png',
    webp: '/kitty.webp',
    default: '/kitty.svg',
  },
} as const;
```

### En Móvil: [`movil/src/shared/config/brand.config.ts`](file:///c:/Parcial-si2/movil/src/shared/config/brand.config.ts) (o `@/constants/brand`)
```typescript
export const BRAND_CONFIG = {
  name: 'Boutique Kitty',
  shortName: 'Kitty',
  subtitle: 'Moda & Estilo',
  tagline: 'Colección 2026',
  legalName: 'BOUTIQUE KITTY S.R.L.',
  version: '1.0.0',
  logo: {
    source: require('@/assets/brand/logo.png'),
    svgSource: require('@/assets/brand/logo.svg'),
    webpSource: require('@/assets/brand/logo.webp'),
    expoIconSource: require('@/assets/expo.icon/kitty.png'),
  },
} as const;
```

---

## 🧩 4. Uso del Componente `<AppLogo />`

### En Frontend React
```tsx
import { AppLogo } from '@/shared/ui/AppLogo';

// Solo ícono pequeño (ej. barra superior)
<AppLogo size="sm" />

// Logo con contenedor circular estilizado
<AppLogo size="md" withContainer={true} />

// Logo completo con texto (ej. Login o Sidebar)
<AppLogo
  size="lg"
  showText={true}
  layout="vertical"
  subtitle="Moda & Estilo"
  withContainer={true}
/>
```

**Lugares actualizados en Frontend:**
- **Sidebar (`Sidebar.tsx`)**: Reemplazó el ícono genérico por `<AppLogo size="sm" showText={sidebarOpen} withContainer={true} />`.
- **Login (`LoginPage.tsx`)**: Encabezado principal con `<AppLogo size="xl" layout="vertical" showText={true} withContainer={true} />`.
- **Carga de rutas (`AppRouter.tsx`)**: Loader dinámico con el logo y texto de carga centralizado.
- **Recibos POS (`ReceiptModal.tsx`)**: Encabezado del ticket de venta impreso con el logo y razón social oficial.
- **Pestaña del navegador (`index.html`)**: Favicon de Kitty y título "Boutique Kitty - Panel Administrativo".

---

### En Móvil React Native
```tsx
import { AppLogo } from '@/shared/ui/AppLogo';

// Logo en encabezado
<AppLogo size="xs" withContainer={true} />

// Logo grande con textos para pantallas de Auth
<AppLogo
  size="lg"
  showText={true}
  layout="vertical"
  withContainer={true}
  titleColor="#FFFFFF"
  subtitleColor="#C8D9E6"
/>
```

**Lugares actualizados en Móvil:**
- **Login (`login.tsx`)**: Cabecera visual con el logo centrado y con estilo corporativo sobre la tarjeta de acceso.
- **Registro (`register.tsx`)**: Cabecera con el logo integrado junto a la navegación.
- **Pantalla de Invitado (`require-auth.tsx`)**: Sustituyó el require directo hardcodeado por `<AppLogo size={80} withContainer={true} />`.
- **Cabecera General (`Header.tsx`)**: Muestra automáticamente el logo de Boutique Kitty en la barra superior.
- **Configuración de la App (`app.json`)**: Configurado el nombre `Boutique Kitty`, ícono de app, splash screen y favicon web.

---

## 🚀 5. ¿Cómo cambiar o renovar el logo en el futuro? (En 1 solo paso)

Si en algún momento el negocio renueva su imagen corporativa, el proceso es sumamente simple:

### Opción A (Reemplazo de archivos, sin tocar código):
1. **Frontend**: Reemplaza el archivo `frontend/public/kitty.svg` (y/o `kitty.png`) con el nuevo logo usando el mismo nombre.
2. **Móvil**: Reemplaza el archivo `movil/assets/brand/logo.png` (y/o `movil/assets/expo.icon/kitty.png`).
¡Listo! Todo el sistema se actualizará de inmediato.

### Opción B (Apuntar a un nuevo nombre de archivo):
1. Copia tu nuevo archivo (ej. `nuevo-logo.png`).
2. En `frontend/src/shared/config/brand.config.ts`, cambia `logo.default: '/nuevo-logo.png'`.
3. En `movil/src/shared/config/brand.config.ts`, cambia `logo.source: require('@/assets/brand/nuevo-logo.png')`.
¡Ningún componente ni pantalla requiere modificación manual!
