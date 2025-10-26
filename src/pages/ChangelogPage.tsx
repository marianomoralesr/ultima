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
              ⏱️ Total de Horas de Desarrollo: <span className="text-2xl">1,850+</span> horas
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-10 space-y-12">
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
