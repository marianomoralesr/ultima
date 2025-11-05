import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  marketingConfigService,
  MarketingConfig,
  ConversionEvent,
  TrackingEvent
} from '../services/MarketingConfigService';
import { Settings, TrendingUp, Activity, Download, CheckCircle, XCircle, Eye, AlertTriangle, Terminal } from 'lucide-react';

const configSchema = z.object({
  gtm_container_id: z.string().regex(/^GTM-[A-Z0-9]+$/, 'Debe ser formato GTM-XXXXXXX'),
  facebook_pixel_id: z.string().regex(/^\d{15,16}$/, 'Debe ser un ID de 15-16 dígitos'),
  google_analytics_id: z.string().regex(/^G-[A-Z0-9]+$/, 'Debe ser formato G-XXXXXXXXXX').optional().or(z.literal('')),
});

type ConfigFormData = z.infer<typeof configSchema>;

const defaultConversionEvents: ConversionEvent[] = [
  {
    id: 'lead',
    name: 'Lead Capturado',
    event_type: 'Lead',
    trigger_location: 'Formulario de contacto, aplicación',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'pageview',
    name: 'Vista de Página',
    event_type: 'PageView',
    trigger_location: 'Todas las páginas',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'viewcontent',
    name: 'Ver Contenido',
    event_type: 'ViewContent',
    trigger_location: 'Páginas de vehículos',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'registration',
    name: 'Registro Completo',
    event_type: 'CompleteRegistration',
    trigger_location: 'Página de autenticación',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
];

export default function MarketingConfigPage() {
  const [config, setConfig] = useState<MarketingConfig | null>(null);
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>(defaultConversionEvents);
  const [recentEvents, setRecentEvents] = useState<TrackingEvent[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'events' | 'analytics'>('config');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      gtm_container_id: '',
      facebook_pixel_id: '',
      google_analytics_id: '',
    }
  });

  useEffect(() => {
    loadConfig();
    loadRecentEvents();
    loadLeadSources();
  }, []);

  const loadConfig = async () => {
    const loadedConfig = await marketingConfigService.getConfig();
    if (loadedConfig) {
      setConfig(loadedConfig);
      setValue('gtm_container_id', loadedConfig.gtm_container_id);
      setValue('facebook_pixel_id', loadedConfig.facebook_pixel_id);
      setValue('google_analytics_id', loadedConfig.google_analytics_id || '');
      if (loadedConfig.conversion_events) {
        setConversionEvents(loadedConfig.conversion_events);
      }
    }
  };

  const loadRecentEvents = async () => {
    const events = await marketingConfigService.getTrackingEvents({ limit: 10 });
    setRecentEvents(events);
  };

  const loadLeadSources = async () => {
    const sources = await marketingConfigService.getLeadSourceAnalytics();
    setLeadSources(sources);
  };

  const onSubmit = async (data: ConfigFormData) => {
    setIsSaving(true);
    setMessage(null);

    const configData: Partial<MarketingConfig> = {
      ...data,
      conversion_events: conversionEvents,
      active: true,
    };

    let result;
    if (config?.id) {
      result = await marketingConfigService.updateConfig(config.id, configData);
    } else {
      result = await marketingConfigService.saveConfig(configData);
    }

    setIsSaving(false);

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
      await loadConfig();
    } else {
      setMessage({ type: 'error', text: `❌ Error: ${result.error}` });
    }
  };

  const toggleEvent = (eventId: string, field: 'enabled' | 'fb_enabled' | 'gtm_enabled') => {
    setConversionEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, [field]: !event[field] } : event
      )
    );
  };

  const testTracking = () => {
    const result = marketingConfigService.testTracking();
    setTestResult(result);

    // Test firing a sample event
    if (result.config) {
      marketingConfigService.trackConversionEvent(
        'test_event',
        'Lead',
        { test: true, timestamp: new Date().toISOString() }
      );
    }
  };

  const exportGTMContainer = () => {
    const container = generateGTMContainer();
    const blob = new Blob([JSON.stringify(container, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gtm-container-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateGTMContainer = () => {
    // This will be a full GTM container JSON structure
    return {
      exportFormatVersion: 2,
      exportTime: new Date().toISOString(),
      containerVersion: {
        path: "accounts/XXXXXX/containers/XXXXXX/versions/0",
        accountId: "XXXXXX",
        containerId: config?.gtm_container_id || "GTM-XXXXXX",
        containerVersionId: "0",
        name: "Ultima Copy - Marketing Tracking",
        description: "Container para tracking de conversiones y eventos de marketing",
        container: {
          path: "accounts/XXXXXX/containers/XXXXXX",
          accountId: "XXXXXX",
          containerId: config?.gtm_container_id || "GTM-XXXXXX",
          name: "Ultima Copy Website",
          publicId: config?.gtm_container_id || "GTM-XXXXXX",
          usageContext: ["WEB"],
          fingerprint: Date.now().toString(),
          tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/XXXXXX/containers/${config?.gtm_container_id || 'GTM-XXXXXX'}/workspaces/0`,
        },
        tag: conversionEvents.filter(e => e.gtm_enabled).map((event, index) => ({
          accountId: "XXXXXX",
          containerId: config?.gtm_container_id || "GTM-XXXXXX",
          tagId: (index + 1).toString(),
          name: `FB Pixel - ${event.name}`,
          type: "html",
          parameter: [
            {
              type: "TEMPLATE",
              key: "html",
              value: `<script>
  if (window.fbq) {
    fbq('track', '${event.event_type}', {
      content_name: '{{Event Name}}',
      source: '{{utm_source}}',
      medium: '{{utm_medium}}',
      campaign: '{{utm_campaign}}'
    });
  }
</script>`
            },
            {
              type: "BOOLEAN",
              key: "supportDocumentWrite",
              value: "false"
            }
          ],
          fingerprint: Date.now().toString(),
          firingTriggerId: [(index + 1).toString()],
          tagFiringOption: "ONCE_PER_EVENT",
          monitoringMetadata: {
            type: "MAP"
          }
        })),
        trigger: conversionEvents.filter(e => e.gtm_enabled).map((event, index) => ({
          accountId: "XXXXXX",
          containerId: config?.gtm_container_id || "GTM-XXXXXX",
          triggerId: (index + 1).toString(),
          name: `Trigger - ${event.name}`,
          type: "CUSTOM_EVENT",
          customEventFilter: [
            {
              type: "EQUALS",
              parameter: [
                {
                  type: "TEMPLATE",
                  key: "arg0",
                  value: "{{_event}}"
                },
                {
                  type: "TEMPLATE",
                  key: "arg1",
                  value: event.event_type.toLowerCase()
                }
              ]
            }
          ],
          fingerprint: Date.now().toString()
        })),
        variable: [
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "1",
            name: "Event Name",
            type: "v",
            parameter: [
              {
                type: "TEMPLATE",
                key: "name",
                value: "eventName"
              }
            ]
          },
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "2",
            name: "utm_source",
            type: "v",
            parameter: [
              {
                type: "TEMPLATE",
                key: "name",
                value: "utm_source"
              }
            ]
          },
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "3",
            name: "utm_medium",
            type: "v",
            parameter: [
              {
                type: "TEMPLATE",
                key: "name",
                value: "utm_medium"
              }
            ]
          },
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "4",
            name: "utm_campaign",
            type: "v",
            parameter: [
              {
                type: "TEMPLATE",
                key: "name",
                value: "utm_campaign"
              }
            ]
          }
        ],
        fingerprint: Date.now().toString(),
        tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/XXXXXX/containers/${config?.gtm_container_id || 'GTM-XXXXXX'}/workspaces/0`
      }
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración de Marketing</h1>
                <p className="text-sm text-gray-500">Google Tag Manager y Facebook Pixel</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={testTracking}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Activity className="w-4 h-4" />
                Test Tracking
              </button>
              <button
                onClick={exportGTMContainer}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Exportar GTM
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Estado del Tracking:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {testResult.config ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>Configuración: {testResult.config ? 'OK' : 'No configurado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {testResult.gtm ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>GTM: {testResult.gtm ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {testResult.facebook ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>FB Pixel: {testResult.facebook ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {message.type === 'error' && message.text.includes('migración') ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Tablas de base de datos no encontradas</p>
                      <p className="text-sm text-red-700 mt-1">
                        Necesitas aplicar las migraciones de base de datos antes de usar esta función.
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Terminal className="w-4 h-4" />
                      <span className="text-gray-400">Ejecuta en tu terminal:</span>
                    </div>
                    <code>supabase db push</code>
                  </div>
                  <p className="text-xs text-red-600">
                    Esto creará las tablas <code className="bg-red-100 px-1 py-0.5 rounded">marketing_config</code> y{' '}
                    <code className="bg-red-100 px-1 py-0.5 rounded">tracking_events</code> en tu base de datos.
                  </p>
                </div>
              ) : (
                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Configuración
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Eventos de Conversión
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Configuration Tab */}
            {activeTab === 'config' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Tag Manager Container ID
                  </label>
                  <Controller
                    name="gtm_container_id"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="GTM-XXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.gtm_container_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.gtm_container_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplo: GTM-XXXXXX. Obtén este ID desde tu cuenta de Google Tag Manager.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Pixel ID
                  </label>
                  <Controller
                    name="facebook_pixel_id"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="123456789012345"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.facebook_pixel_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.facebook_pixel_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    ID numérico de 15-16 dígitos. Encuéntralo en Facebook Business Manager → Eventos.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Analytics 4 ID (Opcional)
                  </label>
                  <Controller
                    name="google_analytics_id"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.google_analytics_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.google_analytics_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Opcional. Formato: G-XXXXXXXXXX
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </form>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Configura qué eventos de conversión se trackean en GTM y Facebook Pixel.
                </p>
                {conversionEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{event.name}</h3>
                        <p className="text-sm text-gray-500">Tipo: {event.event_type}</p>
                        <p className="text-xs text-gray-400">Ubicación: {event.trigger_location}</p>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={event.enabled}
                          onChange={() => toggleEvent(event.id, 'enabled')}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Activo</span>
                      </label>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={event.gtm_enabled}
                          onChange={() => toggleEvent(event.id, 'gtm_enabled')}
                          disabled={!event.enabled}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm">GTM</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={event.fb_enabled}
                          onChange={() => toggleEvent(event.id, 'fb_enabled')}
                          disabled={!event.enabled}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm">Facebook Pixel</span>
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Guardar Eventos
                </button>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Lead Sources */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Fuentes de Leads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leadSources.map((source, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{source.source}</h4>
                          <span className="text-2xl font-bold text-blue-600">{source.count}</span>
                        </div>
                        {source.medium && (
                          <p className="text-xs text-gray-500">Medium: {source.medium}</p>
                        )}
                        {source.campaign && (
                          <p className="text-xs text-gray-500">Campaign: {source.campaign}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Events */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Eventos Recientes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentEvents.map((event, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {event.event_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.event_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.utm_source || 'Direct'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.created_at ? new Date(event.created_at).toLocaleDateString('es-MX') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Instrucciones de Instalación</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Ingresa tu GTM Container ID y Facebook Pixel ID arriba</li>
            <li>Haz clic en "Guardar Configuración" - esto inicializará automáticamente GTM y FB Pixel</li>
            <li>Configura los eventos de conversión en la pestaña "Eventos de Conversión"</li>
            <li>Haz clic en "Exportar GTM" para descargar el contenedor y subirlo a Google Tag Manager</li>
            <li>Usa "Test Tracking" para verificar que todo esté funcionando correctamente</li>
            <li>Monitorea tus conversiones en la pestaña "Analytics"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
