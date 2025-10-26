import React from 'react';
import { BookOpen } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const ChangelogPage: React.FC = () => {
  useSEO({
    title: 'Registro de Cambios - Trefa Autos',
    description: 'Historial de actualizaciones y mejoras de la plataforma Trefa',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">📝 Registro de Cambios</h1>
          <p className="text-lg opacity-95">Autos TREFA - Historial de Actualizaciones</p>
          <p className="text-sm mt-2 opacity-90">trefa.mx</p>
          <div className="mt-6 inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
            <p className="text-lg font-semibold">
              ⏱️ Total de Horas de Desarrollo: <span className="text-2xl">1,900+</span> horas
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-10 space-y-12">
          {/* Version 1.4.0 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.4.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                26 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* CRM Enhancements */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Mejoras al CRM de Leads</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Ordenamiento multi-columna con indicadores visuales</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se agregó funcionalidad de ordenamiento por nombre, email, fecha de creación, última actualización,
                        último inicio de sesión, estatus y fuente. Los usuarios pueden hacer clic en los encabezados de las
                        columnas para ordenar de forma ascendente o descendente, con indicadores de flechas visibles.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📅</span>
                    <div className="flex-1">
                      <strong>Nuevas columnas de fechas con formato relativo</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se añadieron tres columnas temporales: fecha de creación, última actualización y último inicio de sesión.
                        Las fechas se muestran en formato relativo (ej: "Hace 5 min", "Hace 2h", "Hace 3d") para mejor
                        comprensión de la actividad reciente de los leads.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email Notification System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Característica
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Notificaciones por Email con Brevo</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Notificaciones automáticas al enviar solicitud de financiamiento</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Cuando un cliente envía una solicitud de financiamiento, el sistema ahora envía automáticamente
                        tres tipos de notificaciones: (1) confirmación al cliente con enlace de seguimiento, (2) alerta
                        a todos los administradores con detalles del cliente y enlace al perfil, y (3) notificación al
                        asesor de ventas asignado con acceso directo al perfil del cliente.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔧</span>
                    <div className="flex-1">
                      <strong>Servicio centralizado BrevoEmailService</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se creó un servicio wrapper (BrevoEmailService.ts) que centraliza toda la lógica de envío de
                        emails vía Brevo. Incluye métodos especializados para diferentes tipos de notificaciones y
                        manejo de errores robusto. Lista de administradores incluye: marianomorales@outlook.com,
                        mariano.morales@autostrefa.mx, genauservices@gmail.com, alejandro.trevino@autostrefa.mx,
                        evelia.castillo@autostrefa.mx, fernando.trevino@autostrefa.mx.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📬</span>
                    <div className="flex-1">
                      <strong>Template HTML para notificaciones administrativas</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se añadió un nuevo template "admin_notification" en la Edge Function send-brevo-email con diseño
                        responsive y branded de Trefa. El template incluye información del cliente, vehículo de interés,
                        asesor asignado, próximas acciones recomendadas, y botón de acceso directo al perfil.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Edge Function Cleanup */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Optimización
                  </span>
                  <h3 className="text-xl font-semibold">Limpieza de Edge Functions Redundantes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🗑️</span>
                    <div className="flex-1">
                      <strong>Eliminadas 7 funciones no utilizadas o redundantes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se identificaron y eliminaron las siguientes Edge Functions que no están en uso o tienen
                        funcionalidad redundante: swift-responder (usaba Supabase Storage en lugar de R2),
                        rapid-vehicles-sync-ts (duplicada), cron-swift-responder-trigger (trigger de función eliminada),
                        smooth-handler (redundante con rapid-processor), get-thumbnails (usaba tabla deprecada
                        autos_normalizados_cache), facebook-catalogue-csv y api-facebook-catalogue-csv (tabla vacía sin uso).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">⚡</span>
                    <div className="flex-1">
                      <strong>Flujo simplificado: airtable-sync → rapid-processor → frontend</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El sistema ahora opera con un pipeline claro y optimizado: Airtable envía webhooks a airtable-sync,
                        que sincroniza datos con inventario_cache, rapid-processor sirve la API pública de vehículos,
                        y el frontend consume directamente esta API. Esto reduce complejidad y mejora mantenibilidad.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cloudflare R2 Migration */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Migración de Imágenes a Cloudflare R2</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">☁️</span>
                    <div className="flex-1">
                      <strong>Implementación de AWS Signature V4 para autenticación con R2</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se creó el helper r2-helper.ts que implementa el proceso completo de firma AWS Signature V4
                        para uploads a Cloudflare R2. Incluye funciones de hashing SHA256, HMAC-SHA256, generación
                        de llaves de firma, construcción de solicitudes canónicas, y cálculo de la firma de autorización.
                        Todo implementado directamente en Deno sin dependencias externas de SDK.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📤</span>
                    <div className="flex-1">
                      <strong>Upload concurrente con rate limiting (max 3 simultáneos)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La función uploadImagesToR2 procesa imágenes en batches de 3 uploads concurrentes para evitar
                        sobrecargar la API de R2 mientras mantiene buen rendimiento. Las imágenes se organizan por
                        categoría (feature, exterior, interior) en rutas como vehicles/ORDEN/categoria/archivo.jpg.
                        Nombres de archivo se limpian automáticamente de caracteres especiales.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Integración en airtable-sync con descarga desde Airtable</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La Edge Function airtable-sync ahora descarga todas las imágenes de vehículos directamente
                        desde Airtable y las sube a Cloudflare R2 en tiempo real durante la sincronización. Si alguna
                        imagen falla al subirse, el proceso continúa sin interrumpir la sincronización completa. Los
                        URLs de R2 se almacenan en la base de datos (feature_image, fotos_exterior, fotos_interior).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔙</span>
                    <div className="flex-1">
                      <strong>Retrocompatibilidad total con URLs existentes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La función buildPublicUrl en rapid-processor ahora detecta si el path es una URL completa
                        (inicia con http:// o https://) y la retorna tal cual. Esto garantiza que las imágenes antiguas
                        de Airtable y Supabase Storage sigan funcionando mientras se migran gradualmente a R2. No hay
                        breaking changes para vehículos existentes.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🌍</span>
                    <div className="flex-1">
                      <strong>CDN público configurado en r2.trefa.mx</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Las imágenes subidas a R2 se sirven vía el dominio público r2.trefa.mx configurado en Cloudflare.
                        El bucket trefa-images está configurado para acceso público con caché de 1 año (max-age=31536000).
                        Esto mejora significativamente la velocidad de carga y reduce costos de egreso comparado con
                        Supabase Storage.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.3.0 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.3.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                25 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Fixes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Filtros de Vehículos</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Corregidos nombres de propiedades en filtros</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">9ed95d1</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error que causaba que los filtros de marcas, carrocería y otros aparecieran vacíos.
                        Los nombres de propiedades `marcas` y `enganchemin` ahora coinciden correctamente entre el backend y el frontend.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Images CDN */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Cloudflare CDN para Imágenes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Imágenes optimizadas vía Cloudflare CDN</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">9ed95d1</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Todas las imágenes de vehículos ahora se cargan desde Cloudflare CDN (images.trefa.mx) en lugar de Supabase,
                        mejorando significativamente la velocidad de carga y reduciendo costos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Sidebar */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Sidebar de Filtros en Desktop</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Sidebar ahora visible en escritorio</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">c0f83c1</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Se eliminó la renderización condicional que ocultaba el sidebar de filtros en la página de listado de vehículos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Valuation Redirect */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Flujo de Valuación en Visitas</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Redirección automática después de valuación</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">d1439fb</span>
                      <p className="text-gray-600 text-sm mt-1">
                        El formulario de valuación ahora redirige automáticamente a la agenda de Calendly después de recibir una oferta.
                        Se reemplazó el widget placeholder con el componente de valuación completo integrado.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Intelimotor Auth */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Autenticación con Intelimotor</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔐</span>
                    <div className="flex-1">
                      <strong>Corregido error 401 al obtener valuaciones de autos</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">1b6bfbd</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error "Error de autenticación con Intelimotor (401)" que impedía obtener valuaciones de vehículos.
                        La API de Intelimotor requiere que las credenciales (API Key y API Secret) se envíen como parámetros en la URL,
                        no como headers. El proxy ahora extrae las credenciales de los headers y las agrega correctamente a la URL.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Marketing Category Page Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Página de Categorías de Marketing</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Corregida indentación del hook useSEO</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó un error que impedía renderizar la página de categorías de marketing debido a una
                        indentación incorrecta del hook useSEO, que aparecía fuera del cuerpo del componente.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Airtable Config Page Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Página de Configuración de Airtable</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Corregido error de sintaxis en imports</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se movió el import de AirtableImageUploader al inicio del archivo según las reglas de sintaxis ES6.
                        El import estaba ubicado después de las definiciones de componentes, causando un error de parsing.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Changelog Route */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Registro de Cambios como Componente React</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Convertido changelog.html a componente TSX</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El registro de cambios ahora es un componente React completo (ChangelogPage.tsx) con ruta /changelog,
                        integrado completamente con el layout principal de la aplicación. Incluye SEO optimizado y estilos Tailwind.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.2.0 - Major Features */}
          <div className="border-l-4 border-blue-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.2.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* CRM System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema CRM Completo</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Dashboard de leads y gestión de clientes</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">d2f9f54</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Implementación completa de CRM con dashboard de leads, perfiles de clientes, seguimiento de aplicaciones,
                        y sistema de notificaciones por email. Incluye acceso basado en roles (admin/sales) y permisos de asesor.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🔒</span>
                    <div className="flex-1">
                      <strong>Control de acceso seguro para agentes de ventas</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">301631a</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Los agentes solo pueden ver perfiles de clientes que les han otorgado permiso explícito mediante
                        el flag asesor_autorizado_acceso. Implementado con función RPC segura get_secure_client_profile.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">📊</span>
                    <div className="flex-1">
                      <strong>Tracking de fuentes de leads (UTM, RFDM)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Captura automática de parámetros UTM, RFDM y OrdenCompra desde la URL, almacenados en metadatos
                        del perfil de usuario para análisis de efectividad de campañas.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Application System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Solicitudes de Financiamiento</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">📝</span>
                    <div className="flex-1">
                      <strong>Formulario flexible de solicitud</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">0ccd25e</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Los usuarios pueden enviar solicitudes sin tener todos los documentos listos. El campo documents_pending
                        permite tracking de documentos faltantes. Dirección ahora es opcional para mejor UX.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">👤</span>
                    <div className="flex-1">
                      <strong>Flujo de perfilación bancaria</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de dos pasos: primero completar perfil personal, luego perfilación bancaria antes de aplicar.
                        Redirecciones automáticas para guiar al usuario por el flujo correcto.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">💾</span>
                    <div className="flex-1">
                      <strong>Guardado de borradores</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">4f609b4</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Las solicitudes se guardan automáticamente como borradores. Los usuarios pueden continuar
                        desde donde lo dejaron en /escritorio/seguimiento.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Valuation System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Valuación de Vehículos</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">💰</span>
                    <div className="flex-1">
                      <strong>Integración con Intelimotor API</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">1eaaf7b</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema completo de valuación conectado a Intelimotor para obtener precios de mercado en tiempo real.
                        Incluye búsqueda por marca/modelo/año y VIN lookup.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Flujo público y protegido</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Ruta pública /vender-mi-auto para obtener valuación inicial. Ruta protegida /escritorio/vende-tu-auto
                        para subir fotos y completar detalles post-valuación.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* CarStudio AI */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">CarStudio AI - Procesamiento de Imágenes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🤖</span>
                    <div className="flex-1">
                      <strong>Extracción automática de datos de vehículos</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ce04ae5</span>
                      <p className="text-gray-600 text-sm mt-1">
                        AI que analiza fotos de vehículos para extraer marca, modelo, año, color y más.
                        Incluye manejo robusto de errores para imágenes de baja calidad o fondos complejos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Airtable Integration */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Integración con Airtable</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🔗</span>
                    <div className="flex-1">
                      <strong>Sincronización bidireccional de datos</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ffa319f</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de sincronización con Airtable para inventario, leads y compras. Incluye configuración
                        de API keys con fallbacks y página de administración para gestionar la integración.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.1.0 - Core Infrastructure */}
          <div className="border-l-4 border-green-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.1.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Authentication */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Autenticación</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🔐</span>
                    <div className="flex-1">
                      <strong>Login con OTP y Google OAuth</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">781ab4b</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de autenticación dual: login sin contraseña vía código OTP enviado por email,
                        o login con cuenta de Google. Redirección automática a /escritorio después de login exitoso.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">👥</span>
                    <div className="flex-1">
                      <strong>Sistema de roles (Admin/Sales/User)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Asignación automática de roles basada en email. Protección de rutas con AdminRoute y SalesRoute.
                        Agente de ventas asignado automáticamente en round-robin con función get_next_sales_agent.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🛡️</span>
                    <div className="flex-1">
                      <strong>Row Level Security (RLS) completo</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">54d0e1c</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Políticas RLS implementadas en todas las tablas: profiles, financing_applications, bank_profiling,
                        documents, vacancies, applications, y más. Garantiza que usuarios solo accedan a sus propios datos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Vehicle Display */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Vehículos</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🚗</span>
                    <div className="flex-1">
                      <strong>Fetching centralizado con VehicleContext</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Todos los vehículos se obtienen vía VehicleContext usando TanStack Query.
                        Fallback automático de inventario_cache a smooth-handler Edge Function.
                        Caché de 1 hora en IndexedDB para rendimiento óptimo.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🔍</span>
                    <div className="flex-1">
                      <strong>Sistema de filtros avanzado</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">38ed671</span>
                      <p className="text-gray-600 text-sm mt-1">
                        FilterSidebar con cálculo dinámico de counts por marca, año, sucursal, clasificación, transmisión y combustible.
                        FilterSheet móvil con UI optimizada para pantallas pequeñas.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🔗</span>
                    <div className="flex-1">
                      <strong>Generación de slugs con fallbacks</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Slugs generados con cadena de prioridad: slug/ligawp → ordencompra → record_id → id.
                        Garantiza URLs únicas y amigables para SEO.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Vacancies System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Reclutamiento</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">💼</span>
                    <div className="flex-1">
                      <strong>Portal de vacantes y aplicaciones</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Listado público de vacantes en /vacantes. Formulario de aplicación con upload de CV.
                        Dashboard admin para gestionar vacantes y revisar candidatos en /escritorio/admin/vacantes.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Infrastructure */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Infraestructura y Deployment</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🐳</span>
                    <div className="flex-1">
                      <strong>Docker multi-stage build optimizado</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Dockerfile con build de dos etapas para imágenes ligeras. Deploy automatizado a Google Cloud Run
                        con variables de entorno desde cloud-build-vars.yaml.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">☁️</span>
                    <div className="flex-1">
                      <strong>Cloudflare R2 para almacenamiento</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">37c9b65</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Imágenes y documentos almacenados en Cloudflare R2 con URLs firmadas para seguridad.
                        Recursos de Cloud Run aumentados (2GB RAM, 2 CPUs) para mejor rendimiento.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Notificaciones</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Emails automáticos vía Supabase Edge Functions</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">94c526b</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de notificaciones por email con Resend API. Emails de bienvenida, confirmación de solicitudes,
                        asignación de asesor y más. Sender configurado como hola@trefa.mx.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.0.0 - Platform Launch */}
          <div className="border-l-4 border-purple-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.0.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                15 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Platform Launch */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Lanzamiento Beta del Portal Digital TREFA</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">🚀</span>
                    <div className="flex-1">
                      <strong>Plataforma completa de compra-venta y financiamiento de autos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se lanzó la versión beta del Portal Digital TREFA, una plataforma revolucionaria que permite a los clientes
                        comprar, vender y financiar autos seminuevos 100% en línea. Características principales:<br/><br/>
                        • <strong>Catálogo interactivo:</strong> Más de 70 vehículos con filtros avanzados<br/>
                        • <strong>Solicitud de crédito digital:</strong> Formulario multi-paso con validación en tiempo real<br/>
                        • <strong>Valuación con IA:</strong> "Vende tu Auto" usando API de Intelimotor<br/>
                        • <strong>Portal de usuario:</strong> Dashboard personalizado con favoritos y seguimiento<br/>
                        • <strong>Sistema de documentos:</strong> Upload de INE, comprobantes, referencias<br/>
                        • <strong>Perfilamiento bancario:</strong> Recomendaciones personalizadas de instituciones<br/>
                        • <strong>Autenticación segura:</strong> OTP por email, Google y Facebook login<br/><br/>
                        <strong>Horas invertidas:</strong> ~800 horas en desarrollo del MVP
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Microsoft Clarity */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Implementación de Microsoft Clarity</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">📊</span>
                    <div className="flex-1">
                      <strong>Herramienta de análisis de comportamiento de usuarios</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se integró Microsoft Clarity para monitorear cómo los usuarios realmente utilizan la plataforma.
                        Incluye grabación de sesiones, heatmaps, detección de rage clicks, dead clicks y JavaScript errors.
                        Configurado respetando privacidad (enmascara datos sensibles, cumple GDPR).<br/><br/>
                        <strong>Horas invertidas:</strong> ~8 horas en setup e integración
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Lead Management */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Gestión de Leads</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">👥</span>
                    <div className="flex-1">
                      <strong>CRM completo para captura y seguimiento de leads</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Captura desde múltiples fuentes (landing pages, valuaciones, formularios de financiamiento).
                        Sistema de tags, recordatorios, historial de interacciones y sincronización con Kommo CRM.<br/><br/>
                        <strong>Horas invertidas:</strong> ~120 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Initial Fixes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Correcciones Iniciales del Lanzamiento Beta</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">🐛</span>
                    <div className="flex-1">
                      <strong>Página de listado en blanco (FilterSidebar crash)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        FilterSidebar tenía variables indefinidas causando crash. Se agregaron hooks useMemo para calcular
                        todos los conteos de filtros.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">🖼️</span>
                    <div className="flex-1">
                      <strong>Normalización de imágenes de vehículos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Las fotos no se mostraban correctamente. Se arregló el procesamiento para manejar diferentes
                        formatos de datos (Airtable, smooth-handler, inventario_cache).
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.9.5 - Infrastructure */}
          <div className="border-l-4 border-indigo-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v0.9.5</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                30 de Septiembre, 2024
              </span>
            </div>

            <div className="space-y-8">
              {/* Airtable Sync */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Infraestructura
                  </span>
                  <h3 className="text-xl font-semibold">Sincronización Automática Airtable → Supabase</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-indigo-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Sistema de caché inteligente con sincronización en tiempo real</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Webhooks de Airtable + Edge Function sync-inventory. Consultas ultra rápidas (~300ms vs ~3s).
                        Cron job horario como respaldo. Resiliente si Airtable está caído.<br/><br/>
                        <strong>Horas invertidas:</strong> ~45 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cloudflare R2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Infraestructura
                  </span>
                  <h3 className="text-xl font-semibold">Almacenamiento en Cloudflare R2</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-indigo-500 text-xl">☁️</span>
                    <div className="flex-1">
                      <strong>CDN global con cero costos de egreso</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Distribución global vía CDN (latencias menor50ms). URLs firmadas temporales para documentos privados.
                        Buckets organizados (imágenes públicas, documentos privados). Reducción de costos ~60% vs Supabase Storage.<br/><br/>
                        <strong>Horas invertidas:</strong> ~35 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email Automation */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Automatización
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Emails Automatizados (Brevo)</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-indigo-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Flujos de comunicación automatizados</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Emails transaccionales (confirmación, actualizaciones de estatus, OTP). Campañas de marketing
                        (bienvenida, abandono de solicitud, promociones). Templates HTML responsive con tracking.<br/><br/>
                        <strong>Horas invertidas:</strong> ~40 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.9.0 - DevOps */}
          <div className="border-l-4 border-pink-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v0.9.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                18 de Septiembre, 2024
              </span>
            </div>

            <div className="space-y-8">
              {/* GitHub */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    DevOps
                  </span>
                  <h3 className="text-xl font-semibold">Control de Versiones con GitHub</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-pink-500 text-xl">🔧</span>
                    <div className="flex-1">
                      <strong>Sistema profesional de gestión del código fuente</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Repositorio privado en GitHub con branches (main, develop, feature/*). Commits semánticos y
                        protección de main branch. Code review via pull requests.<br/><br/>
                        <strong>Horas invertidas:</strong> ~15 horas en setup y documentación
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cloud Run */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    DevOps
                  </span>
                  <h3 className="text-xl font-semibold">Deploy a Google Cloud Run</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-pink-500 text-xl">🚀</span>
                    <div className="flex-1">
                      <strong>Infraestructura serverless con auto-scaling</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Dockerfile multi-stage optimizado. Deploy script automatizado. Variables de entorno desde YAML.
                        Auto-scaling de 0 a 100 instancias. SSL/HTTPS automático via Cloud Load Balancer.<br/><br/>
                        <strong>Horas invertidas:</strong> ~50 horas en setup y optimización
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 text-center">
          <p className="text-gray-600 text-sm">
            Desarrollado con ❤️ por el equipo de TREFA
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2025 Autos TREFA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage;
