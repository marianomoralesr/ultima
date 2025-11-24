# Reglas del Sistema de Diseño - Integración con Figma (MCP)

> **Sistema Base:** shadcn/ui + Tailwind CSS + Radix UI
>
> Este documento proporciona reglas completas para integrar diseños de Figma en este proyecto usando Model Context Protocol (MCP). El sistema está construido sobre shadcn/ui, un sistema de componentes reutilizables basado en Radix UI y Tailwind CSS.

---

## 📋 Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Tokens de Diseño](#tokens-de-diseño)
3. [Sistema de Componentes](#sistema-de-componentes)
4. [Frameworks y Librerías](#frameworks-y-librerías)
5. [Gestión de Assets](#gestión-de-assets)
6. [Sistema de Iconos](#sistema-de-iconos)
7. [Enfoque de Estilos](#enfoque-de-estilos)
8. [Patrones de Implementación](#patrones-de-implementación)

---

## 1. Estructura del Proyecto

### Organización General

```
ultima copy/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes shadcn/ui base
│   │   ├── dashboard/      # Componentes específicos de dashboard
│   │   ├── landing-builder/ # Constructor de landing pages
│   │   └── VehicleCard/    # Componentes de tarjetas de vehículos
│   ├── pages/              # Páginas de la aplicación
│   ├── lib/                # Utilidades y helpers
│   │   └── utils.ts        # Función cn() para merge de clases
│   ├── context/            # Context providers de React
│   └── assets/             # (No existe, usar /images)
├── public/                 # Assets estáticos
├── images/                 # Imágenes (symlink desde public)
├── index.css              # Estilos globales y CSS variables
├── tailwind.config.js     # Configuración de Tailwind
└── vite.config.ts         # Configuración de build
```

### Alias de Importación

**Configuración en `tsconfig.json` y `vite.config.ts`:**

```typescript
// Usar siempre @ para importaciones desde src/
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

**Regla:** SIEMPRE usar el alias `@/` para importaciones internas, nunca rutas relativas.

---

## 2. Tokens de Diseño

### Sistema de Tokens (shadcn/ui)

Este proyecto usa **CSS Custom Properties (variables CSS)** para tokens de diseño, siguiendo el sistema shadcn/ui.

#### 2.1 Variables CSS (index.css)

```css
:root {
  /* Tokens principales */
  --background: 0 0% 100%;              /* Fondo principal */
  --foreground: 20 14.3% 4.1%;          /* Texto principal */
  --primary: 24.6 95% 53.1%;            /* Color primario (naranja #FF6801) */
  --primary-foreground: 60 9.1% 97.8%;  /* Texto sobre primario */
  --secondary: 60 4.8% 95.9%;           /* Color secundario */
  --muted: 60 4.8% 95.9%;               /* Color apagado */
  --accent: 60 4.8% 95.9%;              /* Color de acento */
  --destructive: 0 84.2% 60.2%;         /* Color destructivo (rojo) */
  --border: 20 5.9% 90%;                /* Bordes */
  --input: 20 5.9% 90%;                 /* Inputs */
  --ring: 24.6 95% 53.1%;               /* Anillo de foco */
  --radius: 0.5rem;                     /* Radio de borde base */

  /* Componentes específicos */
  --card: 0 0% 100%;
  --card-foreground: 20 14.3% 4.1%;
  --popover: 0 0% 100%;
  --popover-foreground: 20 14.3% 4.1%;
}

.dark {
  /* Modo oscuro - Soporte completo */
  --background: 20 14.3% 4.1%;
  --foreground: 60 9.1% 97.8%;
  /* ... otros tokens oscuros */
}
```

#### 2.2 Colores de Marca (Tailwind Config)

```javascript
// tailwind.config.js - Colores personalizados
colors: {
  // ✅ Colores de marca primarios
  'brand-primary': '#FF6801',      // Naranja TREFA
  'brand-navy': '#0B2540',         // Azul marino TREFA
  'brand-bg': '#F7F8FA',          // Fondo claro
  'brand-surface': '#FFFFFF',      // Superficies
  'brand-muted': '#556675',        // Texto secundario
  'brand-success': '#1E8A56',      // Verde éxito
  'brand-danger': '#D64500',       // Rojo peligro
  'brand-secondary': '#FFB37A',    // Naranja claro

  // ✅ Escala de colores primarios
  primary: {
    DEFAULT: '#FF6801',
    100: '#FFE8D6',
    300: '#FFB984',
    400: '#FF944B',
    500: '#FF6801',
    600: '#F56100',
    700: '#E65D00'
  },

  // ✅ Colores de marca legacy
  'trefa-blue': '#274C77',
  'trefa-dark-blue': '#0D274E',

  // ✅ Tokens shadcn/ui (CSS variables)
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  // ... resto de tokens shadcn/ui
}
```

**Regla de Uso:**
- **Nuevos componentes:** Usar tokens shadcn/ui (`bg-background`, `text-foreground`, `border-border`)
- **Componentes de marca:** Usar colores personalizados (`bg-brand-primary`, `text-brand-navy`)
- **Estados:** Usar `primary`, `secondary`, `destructive`, `muted` de shadcn/ui

#### 2.3 Tipografía

```javascript
// tailwind.config.js
fontFamily: {
  sans: ['Be Vietnam Pro', 'sans-serif'], // Fuente principal
}
```

**Escala tipográfica en CSS:**

```css
/* index.css - Clases de tipografía */
body, p {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;  /* Regular */
}

h1 {
  font-weight: 900;  /* Black */
}

h2, .h2 {
  font-weight: 700;  /* Bold */
}

h3, .h3 {
  font-weight: 600;  /* SemiBold */
}

h4 {
  font-weight: 500;  /* Medium */
}
```

**Regla:** Usar siempre `Be Vietnam Pro` como fuente principal. Para consistencia, aplicar clases de Tailwind: `font-semibold`, `font-bold`, `font-black`.

#### 2.4 Espaciado y Radios

```javascript
// Radios de borde (CSS variables)
borderRadius: {
  lg: "var(--radius)",          // 0.5rem (8px)
  md: "calc(var(--radius) - 2px)", // 6px
  sm: "calc(var(--radius) - 4px)", // 4px
}

// Espaciado - usar escala de Tailwind por defecto
// p-4, m-6, gap-3, space-y-2, etc.
```

---

## 3. Sistema de Componentes

### 3.1 Arquitectura: shadcn/ui

Este proyecto usa **shadcn/ui**, que NO es una librería de paquetes NPM, sino **componentes copiables** basados en:

- **Radix UI** (primitivos accesibles)
- **Tailwind CSS** (estilos)
- **class-variance-authority** (variantes)

#### ¿Qué es shadcn/ui?

- Los componentes se copian directamente en `src/components/ui/`
- Son **editables y personalizables** completamente
- Mantienen accesibilidad y mejores prácticas

#### Componentes shadcn/ui Disponibles

**Ubicación:** `src/components/ui/`

```
ui/
├── button.tsx           ✅ Botones con variantes
├── card.tsx            ✅ Tarjetas (Card, CardHeader, CardContent, etc.)
├── dialog.tsx          ✅ Modales y diálogos
├── input.tsx           ✅ Campos de entrada
├── label.tsx           ✅ Etiquetas de formulario
├── select.tsx          ✅ Selectores desplegables
├── checkbox.tsx        ✅ Casillas de verificación
├── switch.tsx          ✅ Interruptores
├── tabs.tsx            ✅ Pestañas
├── dropdown-menu.tsx   ✅ Menús desplegables
├── popover.tsx         ✅ Popovers
├── navigation-menu.tsx ✅ Menús de navegación
├── badge.tsx           ✅ Insignias
├── avatar.tsx          ✅ Avatares
├── separator.tsx       ✅ Separadores
├── scroll-area.tsx     ✅ Áreas de scroll
├── table.tsx           ✅ Tablas
├── sheet.tsx           ✅ Hojas laterales
├── breadcrumb.tsx      ✅ Breadcrumbs
└── interactive-stepper.tsx ✅ Stepper interactivo
```

### 3.2 Patrón de Componentes shadcn/ui

#### Ejemplo: Button (button.tsx)

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ✅ Definir variantes con cva
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white font-semibold hover:bg-primary/90 shadow-sm",
        destructive: "bg-destructive text-white font-semibold hover:bg-destructive/90 shadow-sm",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium",
        secondary: "bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground font-medium",
        link: "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Uso del Componente:**

```tsx
import { Button } from '@/components/ui/button';

// Variantes disponibles
<Button>Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="link">Enlace</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>
```

#### Ejemplo: Card (card.tsx)

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// ... CardTitle, CardDescription, CardContent, CardFooter

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Uso del Componente:**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título de la Tarjeta</CardTitle>
    <CardDescription>Descripción opcional</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

### 3.3 Utilidad cn() - Merge de Clases

**Archivo:** `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Función para merge de clases de Tailwind con precedencia correcta
 * Estándar de shadcn/ui
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Uso:**

```tsx
import { cn } from '@/lib/utils';

// ✅ CORRECTO - Merge inteligente de clases
<div className={cn(
  "base-class p-4 bg-white",
  isActive && "bg-blue-500",
  className // Props adicionales del padre
)} />

// ❌ INCORRECTO - No usar concatenación manual
<div className={`base-class ${isActive ? 'bg-blue-500' : ''}`} />
```

**Regla:** SIEMPRE usar `cn()` para combinar clases de Tailwind.

### 3.4 Componentes Personalizados del Proyecto

**Ubicaciones:**

```
src/components/
├── dashboard/             # Componentes de dashboard
│   ├── FilterPanel.tsx
│   ├── TrendLineChart.tsx
│   └── ConversionFunnel.tsx
├── landing-builder/       # Constructor de landings
│   ├── builders/         # Constructores específicos
│   └── block-templates/  # Templates de bloques
├── VehicleCard/          # Tarjetas de vehículos
│   ├── VehicleCardImage.tsx
│   └── VehicleCardPromotions.tsx
└── *.tsx                 # Componentes generales
```

**Patrón de Componente Personalizado:**

```tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CustomComponentProps {
  title: string;
  className?: string; // SIEMPRE incluir className opcional
}

const CustomComponent: React.FC<CustomComponentProps> = ({
  title,
  className
}) => {
  return (
    <Card className={cn("custom-styles", className)}>
      <CardContent>
        <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
        <Button>Acción</Button>
      </CardContent>
    </Card>
  );
};

export default CustomComponent;
```

---

## 4. Frameworks y Librerías

### 4.1 Stack Principal

```json
{
  "framework": "React 18",
  "bundler": "Vite 5",
  "language": "TypeScript",
  "styling": "Tailwind CSS 3.4",
  "components": "shadcn/ui + Radix UI",
  "routing": "React Router DOM v6",
  "state": "React Context + TanStack Query",
  "forms": "React Hook Form + Zod",
  "animations": "Framer Motion"
}
```

### 4.2 Dependencias Clave

```json
{
  "dependencies": {
    "@radix-ui/*": "^1.x",           // Primitivos de UI accesibles
    "tailwindcss": "^3.4.3",         // Framework CSS
    "class-variance-authority": "^0.7.1", // Variantes de componentes
    "tailwind-merge": "^3.4.0",      // Merge de clases
    "clsx": "^2.1.1",                // Utilidad de clases condicionales
    "framer-motion": "^11.2.10",     // Animaciones
    "react-router-dom": "^6.23.1",   // Routing
    "@tanstack/react-query": "^5.90.3", // Data fetching
    "react-hook-form": "^7.51.4",    // Formularios
    "zod": "^3.23.8",                // Validación
    "lucide-react": "^0.378.0",      // Iconos
    "sonner": "^1.4.41",             // Toast notifications
    "react-hot-toast": "^2.6.0"      // Toasts alternativos
  }
}
```

### 4.3 Plugins de Tailwind

```javascript
// tailwind.config.js
plugins: [
  require('@tailwindcss/container-queries'), // Container queries
  require("tailwindcss-animate"),           // Animaciones predefinidas
]
```

---

## 5. Gestión de Assets

### 5.1 Estructura de Assets

```
Proyecto/
├── public/                    # Assets servidos estáticamente
│   ├── Manual-Venta-TREFA-2025.pdf
│   ├── sitemap.xml
│   └── images -> ../images    # Symlink
└── images/                    # Imágenes reales (fuera de public)
    ├── Chevrolet.png
    ├── Ford.png
    ├── Honda.png
    └── ... (logos de marcas)
```

**Regla:** Las imágenes están en `/images/` (symlink desde `/public/images`).

### 5.2 Patrones de Uso de Imágenes

#### Imágenes Estáticas (Logos de Marca)

```tsx
// ✅ Imágenes locales - path relativo desde public
<img
  src="/images/Chevrolet.png"
  alt="Chevrolet"
  className="w-32 h-auto"
/>
```

#### Imágenes Dinámicas (Vehículos desde API)

```tsx
import LazyImage from '@/components/LazyImage';

// ✅ Usar componente LazyImage para imágenes externas
<LazyImage
  src={vehicle.imageUrl} // URL externa (Supabase, R2, etc.)
  alt={vehicle.title}
  className="w-full h-60 object-cover"
/>
```

**Componente LazyImage:**

```tsx
// src/components/LazyImage.tsx
import React, { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy" // Lazy loading nativo
      className={className}
      onLoad={() => setLoaded(true)}
    />
  );
};

export default LazyImage;
```

### 5.3 Optimización de Imágenes

- **Formato:** Preferir WebP sobre PNG/JPG
- **Tamaño:** Redimensionar antes de subir
- **Loading:** Usar `loading="lazy"` para imágenes below-the-fold
- **Responsive:** Usar clases de Tailwind: `w-full h-auto object-cover`

---

## 6. Sistema de Iconos

### 6.1 Librería: Lucide React

**Instalación:** `lucide-react` (ya instalado)

**Archivo centralizado:** `src/components/icons.tsx`

### 6.2 Patrón de Uso de Iconos

```tsx
// src/components/icons.tsx
import {
  Filter,
  Menu,
  Home,
  User,
  Settings,
  // ... importar todos los iconos de lucide-react
} from 'lucide-react';

type IconProps = React.SVGProps<SVGSVGElement>;

// ✅ Exportar con nombres consistentes
export const FilterIcon: React.FC<IconProps> = (props) => <Filter {...props} />;
export const MenuIcon: React.FC<IconProps> = (props) => <Menu {...props} />;
export const HomeIcon: React.FC<IconProps> = (props) => <Home {...props} />;
export const UserIcon: React.FC<IconProps> = (props) => <User {...props} />;
export const SettingsIcon: React.FC<IconProps> = (props) => <Settings {...props} />;

// ✅ Iconos personalizados para redes sociales
export const WhatsAppIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* SVG path */}
  </svg>
);
```

### 6.3 Uso en Componentes

```tsx
import { HomeIcon, UserIcon, SettingsIcon } from '@/components/icons';

// ✅ Iconos con tamaño y color de Tailwind
<HomeIcon className="w-6 h-6 text-brand-primary" />
<UserIcon className="w-5 h-5 text-muted-foreground" />
<SettingsIcon className="w-4 h-4" />

// ✅ Iconos en botones (shadcn/ui)
<Button>
  <HomeIcon className="w-4 h-4" />
  Inicio
</Button>
```

### 6.4 Convenciones de Iconos

| Categoría | Ejemplos |
|-----------|----------|
| **Navegación** | `HomeIcon`, `ChevronLeftIcon`, `MenuIcon` |
| **Acciones** | `EditIcon`, `TrashIcon`, `SaveIcon` |
| **Estados** | `CheckCircleIcon`, `AlertTriangleIcon`, `Loader2Icon` |
| **Comunicación** | `MailIcon`, `MessageCircleIcon`, `PhoneIcon` |
| **Negocios** | `DollarSignIcon`, `CreditCardIcon`, `BriefcaseIcon` |
| **Vehículos** | `CarIcon`, `TruckIcon`, `FuelIcon` |

**Regla:** SIEMPRE importar iconos desde `@/components/icons.tsx`, nunca directamente de `lucide-react`.

---

## 7. Enfoque de Estilos

### 7.1 Metodología: Tailwind CSS + CSS Variables

Este proyecto usa **Tailwind utility-first** con CSS variables para theming.

#### Prioridad de Estilos:

1. **Clases de Tailwind** (preferido)
2. **CSS Variables** (para theming)
3. **CSS Custom** (solo cuando es necesario)

### 7.2 Clases de Tailwind

```tsx
// ✅ PREFERIDO - Clases de utilidad de Tailwind
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">Título</h2>
  <Button className="bg-brand-primary hover:bg-brand-primary/90">
    Acción
  </Button>
</div>
```

### 7.3 Tokens de Color (shadcn/ui)

```tsx
// ✅ Usar tokens semánticos de shadcn/ui
<Card className="bg-card text-card-foreground border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Título</CardTitle>
    <CardDescription className="text-muted-foreground">
      Descripción
    </CardDescription>
  </CardHeader>
</Card>

// ✅ Estados
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primario
</Button>

<Button className="bg-destructive text-destructive-foreground">
  Eliminar
</Button>
```

### 7.4 Responsive Design

**Mobile-First:** Tailwind usa breakpoints mobile-first.

```tsx
// ✅ Mobile-first responsive
<div className="
  flex flex-col          // Mobile: columna
  md:flex-row           // Tablet y desktop: fila
  gap-4                 // Spacing
  p-4 md:p-6 lg:p-8    // Padding escalable
">
  <div className="w-full md:w-1/2"> {/* 50% en desktop */}
    {/* Contenido */}
  </div>
</div>
```

**Breakpoints:**

```javascript
{
  'sm': '640px',   // Móvil grande
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop grande
  '2xl': '1400px'  // Desktop extra grande (custom)
}
```

### 7.5 Animaciones

#### Animaciones de Tailwind (tailwindcss-animate)

```tsx
// ✅ Animaciones predefinidas
<div className="animate-fade-in">
  Aparece con fade
</div>

<div className="animate-slide-up">
  Se desliza hacia arriba
</div>

<Loader2Icon className="w-4 h-4 animate-spin" />
```

#### Animaciones Personalizadas (index.css)

```css
/* Keyframes personalizados */
@keyframes shimmer {
  from { background-position: 200% center; }
  to { background-position: -200% center; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Clases de utilidad */
@layer utilities {
  .animate-shimmer {
    animation: shimmer 5s ease-out infinite;
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
    animation-fill-mode: both;
  }
}
```

#### Framer Motion (Animaciones Complejas)

```tsx
import { motion } from 'framer-motion';

// ✅ Animaciones de componentes
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="card"
>
  {/* Contenido */}
</motion.div>

// ✅ Animación de lista
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### 7.6 Gradientes de Marca

```css
/* index.css - Gradientes personalizados */
.bg-trefa-bgradient-right {
  background: #033580;
  background: linear-gradient(273deg, rgba(3, 53, 128, 1) 0%, rgba(3, 35, 84, 1) 100%);
}

.bg-trefa-ogradient {
  background: #ff780a;
  background: radial-gradient(circle, rgba(255, 120, 10, 1) 18%, rgba(255, 104, 1, 1) 82%);
}
```

**Uso:**

```tsx
<div className="bg-trefa-bgradient-right text-white p-8">
  Fondo con gradiente azul
</div>
```

### 7.7 Efectos Especiales

#### Glass Morphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
```

#### Bordes Animados (Rezago)

```css
.rezago-border {
  position: relative;
  border: 4px solid transparent !important;
}

.rezago-border::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: calc(1.5rem + 4px);
  padding: 4px;
  background: linear-gradient(90deg, #ea580c, #f97316, #fb923c, #f97316, #ea580c);
  background-size: 400% 100%;
  animation: rezago-gradient-move 4s linear infinite;
}
```

---

## 8. Patrones de Implementación

### 8.1 Integración con Figma MCP

#### Workflow de Diseño a Código:

1. **Obtener diseño de Figma:**
   - Extraer fileKey y nodeId de la URL de Figma
   - Ejemplo URL: `https://figma.com/design/pqrs/ExampleFile?node-id=1-2`
   - fileKey: `pqrs`, nodeId: `1:2`

2. **Mapear componentes de Figma a shadcn/ui:**

| Figma Component | shadcn/ui Component | Archivo |
|-----------------|---------------------|---------|
| Button | `<Button>` | `@/components/ui/button` |
| Card | `<Card>` | `@/components/ui/card` |
| Input Field | `<Input>` | `@/components/ui/input` |
| Modal | `<Dialog>` | `@/components/ui/dialog` |
| Dropdown | `<Select>` | `@/components/ui/select` |
| Checkbox | `<Checkbox>` | `@/components/ui/checkbox` |
| Toggle | `<Switch>` | `@/components/ui/switch` |
| Tabs | `<Tabs>` | `@/components/ui/tabs` |

3. **Aplicar tokens de diseño:**
   - Colores → Usar `bg-brand-primary`, `text-brand-navy`, etc.
   - Tipografía → Usar clases de Tailwind: `text-xl`, `font-bold`
   - Espaciado → Usar escala de Tailwind: `p-4`, `gap-6`, `space-y-3`
   - Bordes → Usar `rounded-lg`, `border-border`

4. **Implementar variantes:**
   - Usar `class-variance-authority` (cva) para variantes complejas
   - Ejemplo: botones con variantes `primary`, `secondary`, `ghost`

### 8.2 Patrón de Componente Completo

```tsx
// src/components/ExampleCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CarIcon, DollarSignIcon } from '@/components/icons';

interface ExampleCardProps {
  title: string;
  description?: string;
  price: number;
  badge?: string;
  onAction?: () => void;
  className?: string;
}

const ExampleCard: React.FC<ExampleCardProps> = ({
  title,
  description,
  price,
  badge,
  onAction,
  className
}) => {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CarIcon className="w-5 h-5 text-brand-primary" />
            <CardTitle className="text-xl font-bold text-brand-navy">
              {title}
            </CardTitle>
          </div>
          {badge && (
            <Badge variant="secondary" className="bg-brand-secondary">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="text-brand-muted">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-2xl font-bold text-brand-primary">
          <DollarSignIcon className="w-6 h-6" />
          {price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onAction}
          className="w-full bg-brand-primary hover:bg-brand-primary/90"
        >
          Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExampleCard;
```

**Uso:**

```tsx
import ExampleCard from '@/components/ExampleCard';

<ExampleCard
  title="Chevrolet Spark 2020"
  description="Excelente estado, pocos kilómetros"
  price={150000}
  badge="Nuevo"
  onAction={() => console.log('Ver detalles')}
  className="max-w-sm"
/>
```

### 8.3 Formularios con React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ✅ Esquema de validación con Zod
const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
});

type FormData = z.infer<typeof formSchema>;

const ContactForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          {...register('name')}
          className={cn(errors.name && "border-destructive")}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={cn(errors.email && "border-destructive")}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Enviar
      </Button>
    </form>
  );
};
```

### 8.4 Data Fetching con TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const VehicleList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario_cache')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loader2Icon className="animate-spin" />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.map((vehicle) => (
        <VehicleCard key={vehicle.id} {...vehicle} />
      ))}
    </div>
  );
};
```

### 8.5 Notificaciones (Toast)

```tsx
import { toast } from 'sonner';

// ✅ Toast de éxito
toast.success('Operación exitosa');

// ✅ Toast de error
toast.error('Algo salió mal');

// ✅ Toast personalizado
toast('Nuevo mensaje', {
  description: 'Has recibido una notificación',
  action: {
    label: 'Ver',
    onClick: () => console.log('Ver'),
  },
});
```

---

## 9. Checklist de Implementación

### Al implementar un diseño de Figma:

- [ ] **Componentes Base:**
  - [ ] ¿Hay un componente shadcn/ui equivalente?
  - [ ] Usar componente de `@/components/ui/` si existe
  - [ ] Extender o personalizar si es necesario

- [ ] **Estilos:**
  - [ ] Usar tokens de color semánticos (`bg-background`, `text-foreground`)
  - [ ] Aplicar colores de marca donde corresponda (`bg-brand-primary`)
  - [ ] Usar clases de Tailwind en lugar de CSS custom
  - [ ] Aplicar responsive design (mobile-first)

- [ ] **Tipografía:**
  - [ ] Usar `Be Vietnam Pro` como fuente
  - [ ] Aplicar pesos correctos: `font-semibold`, `font-bold`, `font-black`
  - [ ] Escala de tamaños: `text-sm`, `text-base`, `text-lg`, `text-xl`, etc.

- [ ] **Espaciado:**
  - [ ] Usar escala de Tailwind: `p-4`, `m-6`, `gap-3`
  - [ ] Consistencia en espaciado vertical: `space-y-4`

- [ ] **Iconos:**
  - [ ] Importar de `@/components/icons.tsx`
  - [ ] Tamaño consistente: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`

- [ ] **Accesibilidad:**
  - [ ] Etiquetas `aria-label` donde sea necesario
  - [ ] Roles semánticos (`button`, `nav`, `main`)
  - [ ] Contraste de color adecuado
  - [ ] Soporte de teclado (focus states)

- [ ] **Optimización:**
  - [ ] Lazy loading de imágenes
  - [ ] Código splitting de componentes pesados
  - [ ] Memoización con `React.memo()` si es necesario

---

## 10. Recursos y Referencias

### Documentación Oficial

- **shadcn/ui:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/
- **Lucide Icons:** https://lucide.dev/

### Ejemplos de Código

**Ver componentes existentes en:**
- `src/components/ui/` - Componentes shadcn/ui base
- `src/components/` - Componentes personalizados del proyecto

### Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## Resumen Ejecutivo

Este proyecto usa **shadcn/ui**, un sistema de componentes basado en:

1. **Radix UI** → Primitivos accesibles
2. **Tailwind CSS** → Estilos utility-first
3. **TypeScript** → Type safety
4. **React 18** → UI framework

**Reglas de oro:**

1. ✅ Usar componentes de `@/components/ui/` primero
2. ✅ Importar con alias `@/`
3. ✅ Usar `cn()` para merge de clases
4. ✅ Tokens de color semánticos (`bg-background`, `text-foreground`)
5. ✅ Colores de marca (`bg-brand-primary`, `text-brand-navy`)
6. ✅ Iconos desde `@/components/icons.tsx`
7. ✅ Mobile-first responsive
8. ✅ Fuente: `Be Vietnam Pro`

**Flujo de trabajo con Figma:**

```
Figma Design → Identificar Componentes → Mapear a shadcn/ui →
Aplicar Tokens → Implementar con TypeScript + Tailwind → Testing
```

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0.0
