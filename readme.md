#  Portal Digital TREFA: El Futuro del Financiamiento Automotriz

![Logo TREFA](autos.trefa.mx/wp-content/uploads/2024/09/trefa-logotipo-blanco-500-px.png)

Bienvenido a la documentación oficial del **Portal Digital TREFA**, una plataforma de vanguardia diseñada para revolucionar la experiencia de compra y venta de vehículos seminuevos. Nuestra misión es hacer que el financiamiento automotriz sea rápido, transparente y 100% digital.

---

### 📊 Estado del Proyecto
-   **Versión Actual:** Beta 1.0
-   **Estado:** Desplegado y en fase de pruebas beta.
-   **Próximos Pasos:** Recopilación de feedback de usuarios y planificación de la v1.1.

---

### 🚀 Nuestra Visión

Estamos construyendo más que un sitio web de inventario de autos; estamos creando un ecosistema completo que empodera tanto a usuarios como a administradores. Para nuestros clientes, ofrecemos un viaje sin interrupciones desde el descubrimiento del auto perfecto hasta la obtención de financiamiento desde la comodidad de su hogar. Para nuestro equipo, proporcionamos herramientas potentes y centralizadas para gestionar marketing, ventas y operaciones con una eficiencia sin igual.

---

## 📜 Historial de Desarrollo

Nuestra plataforma ha estado en constante evolución para ofrecer la mejor experiencia posible. Este es un resumen de nuestro viaje:

-   **Febrero - Marzo 2025:**
    -   🚀 **Lanzamiento del Proyecto:** Configuración inicial de la aplicación (React, Vite, Supabase).
    -   🔐 **Sistema de Autenticación:** Creación de los módulos de inicio de sesión, registro y autenticación social (Google/Facebook).
    -   🔗 **Integración con WordPress:** Primera conexión para sincronizar el inventario de vehículos.
    -   🛠️ **Bases del Catálogo:** Desarrollo de las páginas de listado y detalle de vehículos.

-   **Abril 2025:**
    -   🔍 **Funcionalidad Avanzada de Inventario:** Implementación de filtros complejos y búsqueda inteligente.
    -   ❤️ **Sistema de Favoritos:** Los usuarios registrados ya pueden guardar y comparar sus autos preferidos.
    -   🏠 **Dashboard de Usuario:** Creación del panel de control (`/escritorio`) y la página de perfil (`/profile`).

-   **Mayo 2025:**
    -   💰 **Módulo "Vende tu Auto":** Lanzamiento de la herramienta de valuación instantánea (`/quote-car`) con integración profesional de Intelimotor®.
    -   📝 **Solicitud de Financiamiento Digital:** Desarrollo del formulario multi-paso para solicitar crédito (`/aplicacion`).

-   **Junio 2025:**
    -   📂 **Carga Segura de Documentos:** Integración del sistema para que los usuarios suban sus documentos de forma segura.
    -   🏦 **Perfilamiento Bancario:** Creación del cuestionario inteligente (`/perfilacion-bancaria`) para optimizar la aprobación de créditos.
    -   🏷️ **Página de Promociones:** Lanzamiento de una sección dedicada a vehículos con ofertas especiales (`/promociones`).

-   **Julio - Agosto 2025:**
    -   🛠️ **Centro de Marketing para Admins:** Creación del "Marketing Admin Hub" con gestión de integraciones, creador de eventos visual y constructor de UTMs.
    -   🤖 **Lanzamiento del Creative Hub:** Integración de un generador de contenido con IA para crear artículos, imágenes y UTMs para campañas de marketing de forma automatizada.
    -   ❓ **Página de Preguntas Frecuentes:** Implementación de una sección de ayuda completa y categorizada (`/faq`).
    -   ✨ **Refinamiento General:** Mejoras de UI/UX en toda la plataforma y lanzamiento de nuevas variantes de landing pages.

-   **Septiembre 2025:**
    -   📸 **Integración con Car Studio AI:** Implementación de la API para procesamiento y mejora de imágenes de vehículos con inteligencia artificial, incluyendo un sistema de respaldo automático a Supabase Storage.
    -   🔄 **Flujo de Onboarding Guiado:** Implementación de una secuencia obligatoria para nuevos usuarios (Perfil > Perfilamiento > Aplicación) para garantizar la calidad de los datos.
    -   🧠 **Redirección Inteligente:** Se mejoró el flujo post-login para preservar la intención del usuario (ej. financiar un auto específico) a través del proceso de registro y autenticación.
-   **Octubre 2025:**
    -   🐞 **Corrección de Bugs Críticos:** Solucionado un error de navegación que impedía ver correctamente los detalles de los vehículos y la paginación.
    -   🎨 **Refinamiento de UI/UX:** Mejorada la página de acceso, se eliminó el scroll horizontal en móviles, se optimizó el flujo de la solicitud de financiamiento (datos prellenados, feedback de subida de archivos, mejora de consentimientos) y se rediseñó la pantalla de resumen.
    -   ✅ **Funcionalidad de Envío de Solicitud:** Corregido el error que impedía enviar la solicitud de financiamiento a la base de datos.
    -   🔔 **Mejoras en Seguimiento:** Añadida la funcionalidad (visual) para que los usuarios gestionen sus notificaciones en la página de seguimiento.

---

## 🗺️ Resumen de la App: Un Tour por Nuestra Plataforma

Nuestra aplicación se divide en dos áreas principales: el **Sitio Público** para nuestros clientes y el **Dashboard Seguro** para usuarios registrados y administradores.

### Sitio Público

| Página | Icono | Tipo de Usuario | Propósito y Funcionalidades Clave |
| :--- | :---: | :---: | :--- |
| **Landing Pages** | 🎨 | Visitante | **Qué es:** Los puntos de entrada principales (`/`, `/landing-b`, `/landing-c`) a nuestra plataforma, diseñados para cautivar a los visitantes y generar conversiones. <br/> **Funcionalidades:** <ul><li>**Pruebas A/B/C:** Probamos activamente diferentes diseños para optimizar la interacción del usuario.</li><li>**Sliders de Vehículos Dinámicos:** Mostramos nuestro mejor inventario en un carrusel 3D interactivo.</li><li>**Captura de Leads:** Un formulario inteligente para capturar clientes potenciales y nutrirlos directamente en nuestro embudo de ventas.</li><li>**Narrativa de Marca:** Secciones dedicadas a nuestra propuesta de valor, garantías y testimonios de clientes.</li></ul> |
| **Inventario de Vehículos** (`/autos`) | 🚗 | Visitante | **Qué es:** Un catálogo completo de vehículos seminuevos certificados. La información se obtiene de una API de WordPress, con un respaldo automático a una vista de Supabase (`public.inventario`) que envuelve nuestro inventario en Airtable, garantizando alta disponibilidad. <br/> **Funcionalidades:** <ul><li>**Filtrado Avanzado:** Los usuarios pueden filtrar por marca, modelo, año, rango de precios, enganche, promociones y más.</li><li>**Búsqueda Inteligente:** Una potente barra de búsqueda para encontrar vehículos específicos rápidamente.</li><li>**Doble Vista:** Cambia entre una vista de lista detallada y una vista de cuadrícula visual.</li><li>**Vistos Recientemente:** Un componente inteligente que recuerda a los usuarios los autos en los que han mostrado interés.</li></ul> |
| **Detalles del Vehículo** (`/autos/:slug`) | 📊 | Visitante | **Qué es:** Una página dedicada para cada auto, proporcionando toda la información que un cliente necesita para tomar una decisión. <br/> **Funcionalidades:** <ul><li>**Galería Multimedia Completa:** Fotos en alta resolución, videos y un visor de imágenes interactivo.</li><li>**Especificaciones Detalladas:** Todos los detalles técnicos y cosméticos listados claramente.</li><li>**Calculadora de Financiamiento:** Una herramienta interactiva para estimar los pagos mensuales según el enganche y el plazo.</li><li>**Reporte de Inspección:** Acceso a un reporte detallado de inspección de 150 puntos, ofreciendo total transparencia.</li><li>**Compartir y Favoritos:** Opciones fáciles de un clic para compartir el vehículo o guardarlo en su perfil.</li></ul> |
| **Vende tu Auto** (`/quote-car`) | 💰 | Visitante | **Qué es:** Una herramienta de valuación instantánea, impulsada por el servicio profesional de Intelimotor®, para usuarios que buscan vender su auto. <br/> **Funcionalidades:** <ul><li>**Búsqueda con IA:** Los usuarios pueden describir su auto en lenguaje natural (ej., "Nissan Versa 2020") para encontrar el modelo exacto.</li><li>**Generación de Oferta Instantánea:** Calcula una oferta de mercado competitiva en segundos.</li><li>**Contacto Directo:** Permite a los usuarios aceptar la oferta y programar una inspección directamente a través de WhatsApp.</li></ul> |
| **Promociones** (`/promociones`) | 🏷️ | Visitante | **Qué es:** Una sección especial que destaca vehículos con ofertas únicas como bonos de descuento o beneficios. <br/> **Funcionalidades:** <ul><li>**Banners Dinámicos:** Banners visuales para cada promoción activa.</li><li>**Vistas Filtradas:** Los usuarios pueden explorar todos los vehículos asociados con una promoción específica.</li></ul> |
| **Inicio de Sesión y Registro** | 🔑 | Visitante | **Qué es:** Páginas seguras y fáciles de usar para la creación y el acceso a cuentas. <br/> **Funcionalidades:** <ul><li>**Acceso sin Contraseña:** Utiliza un sistema de código de un solo uso (OTP) enviado por correo para un acceso rápido y seguro.</li><li>**Recuperación de Contraseña:** Un flujo seguro para "Olvidé mi contraseña".</li><li>**Redirección Inteligente:** Recuerda a dónde intentaba ir un usuario y lo lleva allí después de iniciar sesión.</li></ul> |

### Dashboard Seguro de Usuario y Admin (`/escritorio`)

| Página | Icono | Tipo de Usuario | Propósito y Funcionalidades Clave |
| :--- | :---: |:---: | :--- |
| **Dashboard Principal** | 📈 | Usuario Registrado | **Qué es:** El centro de control para usuarios registrados después de iniciar sesión. <br/> **Funcionalidades:** <ul><li>**Guía de Onboarding:** Dirige a los nuevos usuarios a completar los pasos necesarios antes de poder aplicar.</li><li>**Resumen General:** Resume las solicitudes activas y las acciones requeridas.</li><li>**Proyecciones Financieras:** Una herramienta para ayudar a los usuarios a entender sus posibles opciones de financiamiento.</li><li>**Vehículos Recomendados:** Un carrusel personalizado de autos que se ajustan al presupuesto potencial del usuario.</li></ul> |
| **Mi Perfil** (`/profile`) | 👤 | Usuario Registrado | **Qué es:** Una sección donde los usuarios gestionan su información personal y financiera. <br/> **Funcionalidades:** <ul><li>**Gestión Completa del Perfil:** Los usuarios pueden actualizar su información de contacto, dirección y fiscal.</li><li>**Cálculo Automático de RFC:** Calcula inteligentemente el RFC del usuario en tiempo real basado en sus datos.</li><li>**Cambios de Contraseña Seguros:** Un formulario dedicado para actualizar las credenciales de la cuenta.</li></ul> |
| **Solicitud de Financiamiento** (`/aplicacion`) | 📝 | Usuario Registrado | **Qué es:** El núcleo de nuestra plataforma: un formulario digital multi-paso para solicitar financiamiento de vehículos. <br/> **Funcionalidades:** <ul><li>**Datos Prellenados:** El formulario se inicia con la información del perfil del usuario ya cargada para agilizar el proceso.</li><li>**Selección Inteligente de Vehículo:** Rellena automáticamente los datos del auto si el usuario inicia desde una página de vehículo específica.</li><li>**Carga Segura de Documentos:** Una interfaz de arrastrar y soltar con feedback visual instantáneo para subir los documentos requeridos.</li><li>**Envío Seguro:** Guarda toda la información de la solicitud de forma segura y completa en la base de datos.</li></ul> |
| **Perfilamiento Bancario** (`/perfilacion-bancaria`) | 🏦 | Usuario Registrado | **Qué es:** Un cuestionario inteligente que nos ayuda a determinar qué banco tiene más probabilidades de aprobar el crédito del usuario. <br/> **Funcionalidades:** <ul><li>**Cuestionario Guiado:** Hace preguntas financieras clave para construir un perfil de crédito.</li><li>**Coincidencia Inteligente:** El sistema usa estos datos para recomendar las mejores opciones bancarias, aumentando la tasa de aprobación.</li></ul> |
| **Favoritos** (`/favorites`) | ❤️ | Usuario Registrado | **Qué es:** Una galería personal de todos los vehículos que un usuario ha guardado. <br/> **Funcionalidades:** <ul><li>**Vista Centralizada:** Los usuarios pueden ver todos sus autos guardados en un solo lugar.</li><li>**Comparación Fácil:** El formato de lista permite una comparación rápida entre vehículos favoritos.</li></ul> |
| **Página de FAQ** (`/faq`) | ❓ | Usuario Registrado | **Qué es:** Una lista completa y categorizada de preguntas frecuentes. <br/> **Funcionalidades:** <ul><li>**Información Categorizada:** Organizada por temas como "Financiamiento", "Vender tu Auto", etc.</li><li>**Acordeones Interactivos:** Una interfaz limpia y fácil de usar para encontrar respuestas rápidamente.</li></ul> |
| **Centro de Marketing** (`/marketing`) | 🛠️ | Admin | **Qué es:** Un potente centro de control todo en uno para el equipo de marketing. **(Solo Administradores)** <br/> **Funcionalidades:** <ul><li>**Dashboard de Integraciones:** Habilita, deshabilita y gestiona claves de API para Google Analytics, GTM, Facebook Pixel y Kommo CRM en un solo lugar.</li><li>**Gestor de Eventos Gráfico:** Una interfaz visual al estilo de GTM para crear y gestionar eventos de seguimiento personalizados sin escribir código.</li><li>**Constructor de UTMs:** Una herramienta para generar URLs de campaña con seguimiento y asociarlas con vehículos y campañas de Facebook específicas para un análisis preciso del embudo.</li><li>**Creative Hub (IA):** Un generador de contenido que, a partir de la selección de un auto, tema y tono, crea artículos, imágenes y UTMs listos para publicar en diferentes canales.</li><li>**Depurador de Car Studio:** Un panel de pruebas para interactuar directamente con la API de Car Studio, procesar imágenes y guardarlas en el inventario.</li><li>**Estadísticas de Clarity:** Un panel simulado e integrado de Clarity para ver grabaciones de sesiones y mapas de calor ficticios.</li></ul> |

---

## ⏱️ Tiempo de Desarrollo Estimado

Este proyecto, desde su concepción hasta su estado actual de preparación para producción, representa un esfuerzo de desarrollo significativo llevado a cabo por un solo desarrollador.

-   **Inicio de proyecto:** 8 de Febrero, 2025
-   **Fecha del beta:** 15 de Octubre, 2025
-   **Lanzamiento Beta v1.0:** 15 de Octubre, 2025
-   **Total de horas estimadas:** **1600+ horas**

Esta estimación refleja el tiempo dedicado al diseño de UX/UI, desarrollo frontend, arquitectura de backend (Supabase), integraciones de API, pruebas, despliegue y gestión del proyecto, demostrando la capacidad de construir aplicaciones complejas y robustas con herramientas modernas y un enfoque ágil.

---

## 🤖 Costos Estimados de Servicios de IA

La plataforma utiliza servicios de Inteligencia Artificial para mejorar la experiencia del usuario y automatizar tareas de marketing. A continuación se presenta un desglose de los costos estimados mensuales.

| Servicio | Proveedor | Uso Principal | Costo Mensual Estimado (USD) |
| :--- | :--- | :--- | :--- |
| **Valuación de Vehículos** | Intelimotor | Búsqueda y valuación en el módulo `/quote-car`. | $150 - $250 |
| **Procesamiento de Imágenes** | Car Studio AI | Mejora de fondos de imágenes para el inventario. | $100 - $200 |
| **Generación de Contenido** | Google (Gemini) | Creación de artículos y copys en el Creative Hub. | $50 - $100 |
| **Total Estimado** | | | **$300 - $550** |

*Nota: Estos costos son estimaciones y pueden variar según el volumen de uso y las tarifas vigentes de los proveedores.*

---

## ✨ Características Únicas y Automatizaciones

Lo que distingue a esta plataforma es su enfoque en la automatización inteligente y la robustez técnica:

-   **Disponibilidad Híbrida de Datos:** El inventario utiliza la API de WordPress como fuente primaria, pero cuenta con un sistema de fallback automático a un caché en Supabase, el cual a su vez puede recurrir a un Foreign Data Wrapper (FDW) de Airtable. Esto garantiza una disponibilidad de datos cercana al 100%.
-   **Cálculo de RFC en Tiempo Real:** La página de perfil del usuario calcula el RFC mexicano al instante mientras el usuario escribe, proporcionando retroalimentación inmediata y asegurando la precisión de los datos antes de guardarlos.
-   **Flujo de Onboarding Guiado:** El sistema obliga a los nuevos usuarios a completar su perfil personal y luego su perfilamiento bancario antes de poder iniciar una solicitud de financiamiento, eliminando solicitudes incompletas y mejorando la calidad de los leads.
-   **Redirección Inteligente Post-Login:** La aplicación preserva la intención del usuario. Si un cliente hace clic en "Financiar" en un auto específico y luego se registra, será redirigido directamente al formulario de solicitud con ese auto ya preseleccionado después de confirmar su correo.
-   **Generación de Contenido con IA (Creative Hub):** Una herramienta para administradores que automatiza la creación de artículos de blog, copys para redes sociales y URLs de seguimiento (UTMs) para campañas de marketing, todo basado en el inventario de vehículos.
-   **Procesamiento de Imágenes con IA (Car Studio):** El sistema se conecta a la API de Car Studio para mejorar las fotos de los vehículos con fondos de calidad profesional. Las imágenes procesadas no solo se guardan en el registro del vehículo, sino que también se respaldan automáticamente en un bucket de almacenamiento seguro y privado en Supabase.
-   **Centro de Marketing Centralizado:** Un panel de control para administradores que unifica la gestión de todas las herramientas de marketing digital (Analytics, GTM, Pixel, etc.) y campañas en un solo lugar.
-   **Seguridad y Aislamiento de Datos:** Se implementan políticas de Seguridad a Nivel de Fila (RLS) en todas las tablas y buckets de almacenamiento de Supabase, garantizando que cada usuario solo pueda acceder y modificar su propia información.

---

## 💻 Tecnologías y APIs Conectadas

Esta aplicación se construyó utilizando un stack moderno y escalable:

-   **Frontend:**
    -   React (con Hooks)
    -   Vite (para un desarrollo y build ultra-rápidos)
    -   TypeScript (para seguridad de tipos)
    -   Tailwind CSS (para un diseño de UI rápido y consistente)

-   **Backend & Base de Datos:**
    -   **Supabase:**
        -   PostgreSQL Database
        -   Authentication (Auth)
        -   Storage (para documentos y respaldos de imágenes)
        -   Edge Functions (para llamadas RPC como el fallback a Airtable)

-   **CMS / Fuente de Datos Primaria:**
    -   WordPress (a través de su REST API)

-   **Fuente de Datos de Respaldo:**
    -   Airtable (integrado a Supabase a través de un Foreign Data Wrapper)

-   **APIs Externas y Servicios Conectados:**
    -   **Intelimotor:** Para la valuación de vehículos en tiempo real.
    -   **Car Studio AI:** Para el procesamiento y mejora de imágenes de vehículos.
    -   **Google Analytics & Google Tag Manager:** Para el seguimiento de analíticas y eventos.
    -   **Facebook Pixel & Conversions API (CAPI):** Para el seguimiento de conversiones de campañas.
    -   **Lead Connector / Webhooks:** Para enviar datos de leads a sistemas externos como CRMs (Kommo).

---

### ™️ Créditos

-   **Autor:** Mariano Morales Ramirez
-   **Propietario:** Grupo TREFA