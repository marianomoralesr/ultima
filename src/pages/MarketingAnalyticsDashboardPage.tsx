import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, MousePointerClick,
  Calendar, Filter, Download, RefreshCw, ExternalLink, AlertCircle,
  FileText, Eye, TrendingDown, CheckCircle, Clock
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { MetricsService, type FunnelMetrics, type MetaFunnelMetrics } from '../services/MetricsService';

interface TrackingEvent {
  id?: string;
  event_name: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  created_at?: string;
}

interface DashboardMetrics {
  // Métricas del embudo principal
  funnelMetrics: FunnelMetrics;
  metaFunnelMetrics: MetaFunnelMetrics;

  // Métricas adicionales
  total_events: number;
  unique_sessions: number;
  unique_users: number;

  // Top fuentes y campañas
  top_sources: Array<{ source: string; count: number; users: number }>;
  top_campaigns: Array<{ campaign: string; count: number; users: number }>;

  // Eventos por tipo
  events_by_type: Array<{ type: string; count: number; percentage: number }>;

  // Eventos en el tiempo
  events_over_time: Array<{ date: string; count: number }>;

  // Páginas más vistas
  top_pages: Array<{ page: string; views: number; unique_users: number }>;
}

const MarketingAnalyticsDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [rawEvents, setRawEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    utmSource?: string;
    utmCampaign?: string;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'sources' | 'campaigns' | 'pages' | 'events' | 'meta-funnel'>('overview');

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener métricas del embudo usando MetricsService
      const [funnelMetrics, metaFunnelMetrics, sources, campaigns] = await Promise.all([
        MetricsService.getFunnelMetrics(filters.startDate, filters.endDate),
        MetricsService.getMetaFunnelMetrics(filters.startDate, filters.endDate),
        MetricsService.getAvailableUTMSources(),
        MetricsService.getAvailableUTMCampaigns()
      ]);

      setAvailableSources(sources);
      setAvailableCampaigns(campaigns);

      // 2. Obtener eventos raw para análisis detallado
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }
      if (filters.utmSource) {
        query = query.eq('utm_source', filters.utmSource);
      }
      if (filters.utmCampaign) {
        query = query.eq('utm_campaign', filters.utmCampaign);
      }

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) {
        throw new Error(`Error cargando eventos: ${eventsError.message}`);
      }

      const events = eventsData || [];
      setRawEvents(events);

      // 3. Calcular métricas adicionales
      const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;
      const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size;

      // Top fuentes
      const sourceMap = new Map<string, { count: number; users: Set<string> }>();
      events.forEach(e => {
        const source = e.utm_source || 'directo';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { count: 0, users: new Set() });
        }
        const entry = sourceMap.get(source)!;
        entry.count++;
        if (e.user_id) entry.users.add(e.user_id);
      });

      const top_sources = Array.from(sourceMap.entries())
        .map(([source, data]) => ({
          source,
          count: data.count,
          users: data.users.size
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top campañas
      const campaignMap = new Map<string, { count: number; users: Set<string> }>();
      events.forEach(e => {
        if (e.utm_campaign) {
          if (!campaignMap.has(e.utm_campaign)) {
            campaignMap.set(e.utm_campaign, { count: 0, users: new Set() });
          }
          const entry = campaignMap.get(e.utm_campaign)!;
          entry.count++;
          if (e.user_id) entry.users.add(e.user_id);
        }
      });

      const top_campaigns = Array.from(campaignMap.entries())
        .map(([campaign, data]) => ({
          campaign,
          count: data.count,
          users: data.users.size
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Eventos por tipo
      const typeMap = new Map<string, number>();
      events.forEach(e => {
        const type = e.event_type || e.event_name;
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });

      const totalEvents = events.length;
      const events_by_type = Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Eventos en el tiempo (últimos 30 días)
      const dateMap = new Map<string, number>();
      events.forEach(e => {
        if (e.created_at) {
          const date = new Date(e.created_at).toISOString().split('T')[0];
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        }
      });

      const events_over_time = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Páginas más vistas
      const pageMap = new Map<string, { views: number; users: Set<string> }>();
      events
        .filter(e => e.event_type === 'PageView')
        .forEach(e => {
          const page = e.metadata?.page || 'unknown';
          if (!pageMap.has(page)) {
            pageMap.set(page, { views: 0, users: new Set() });
          }
          const entry = pageMap.get(page)!;
          entry.views++;
          if (e.user_id) entry.users.add(e.user_id);
        });

      const top_pages = Array.from(pageMap.entries())
        .map(([page, data]) => ({
          page,
          views: data.views,
          unique_users: data.users.size
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);

      // 4. Consolidar todas las métricas
      setMetrics({
        funnelMetrics,
        metaFunnelMetrics,
        total_events: totalEvents,
        unique_sessions: uniqueSessions,
        unique_users: uniqueUsers,
        top_sources,
        top_campaigns,
        events_by_type,
        events_over_time,
        top_pages
      });

    } catch (err) {
      console.error('[MarketingAnalytics] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.startDate, filters.endDate, filters.utmSource, filters.utmCampaign]);

  // Función para calcular tasas de conversión
  const calculateConversionRates = (funnel: FunnelMetrics) => {
    const safeDiv = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

    return {
      landing_to_registration: safeDiv(funnel.registrations, funnel.landing_page_views),
      registration_to_profile: safeDiv(funnel.profile_completes, funnel.registrations),
      profile_to_bank: safeDiv(funnel.bank_profiling_completes, funnel.profile_completes),
      bank_to_application: safeDiv(funnel.application_starts, funnel.bank_profiling_completes),
      application_to_lead: safeDiv(funnel.lead_completes, funnel.application_starts),
      overall: safeDiv(funnel.lead_completes, funnel.landing_page_views)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const conversionRates = calculateConversionRates(metrics.funnelMetrics);
  const metaConversionRates = calculateConversionRates({
    landing_page_views: metrics.metaFunnelMetrics.meta_landing_views,
    registrations: metrics.metaFunnelMetrics.meta_registrations,
    profile_completes: metrics.metaFunnelMetrics.meta_profile_completes,
    bank_profiling_completes: metrics.metaFunnelMetrics.meta_bank_profiling_completes,
    application_starts: metrics.metaFunnelMetrics.meta_application_starts,
    lead_completes: metrics.metaFunnelMetrics.meta_lead_completes,
    application_submissions: 0,
    landing_user_ids: [],
    registered_user_ids: [],
    profile_complete_user_ids: [],
    bank_profile_user_ids: [],
    application_start_user_ids: [],
    lead_complete_user_ids: []
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing Analytics</h1>
              <p className="text-gray-600 mt-1">Panel completo de métricas y embudo de conversión</p>
            </div>
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente UTM
              </label>
              <select
                value={filters.utmSource || ''}
                onChange={(e) => setFilters({ ...filters, utmSource: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todas las fuentes</option>
                {availableSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaña UTM
              </label>
              <select
                value={filters.utmCampaign || ''}
                onChange={(e) => setFilters({ ...filters, utmCampaign: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todas las campañas</option>
                {availableCampaigns.map(campaign => (
                  <option key={campaign} value={campaign}>{campaign}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.total_events.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Únicos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.unique_users.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads Completos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.funnelMetrics.lead_completes.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversión Global</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{conversionRates.overall}%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6" aria-label="Tabs">
              {[
                { key: 'overview', label: 'Resumen', icon: BarChart3 },
                { key: 'funnel', label: 'Embudo', icon: TrendingDown },
                { key: 'meta-funnel', label: 'Embudo Meta', icon: TrendingDown },
                { key: 'sources', label: 'Fuentes', icon: MousePointerClick },
                { key: 'campaigns', label: 'Campañas', icon: FileText },
                { key: 'pages', label: 'Páginas', icon: Eye },
                { key: 'events', label: 'Eventos', icon: Clock }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Resumen de Métricas</h3>

                {/* Embudo compacto */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Landing Views</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{metrics.funnelMetrics.landing_page_views}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-indigo-600 font-medium">Registros</p>
                    <p className="text-2xl font-bold text-indigo-900 mt-1">{metrics.funnelMetrics.registrations}</p>
                    <p className="text-xs text-indigo-600 mt-1">{conversionRates.landing_to_registration}%</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Perfil Completo</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{metrics.funnelMetrics.profile_completes}</p>
                    <p className="text-xs text-purple-600 mt-1">{conversionRates.registration_to_profile}%</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <p className="text-sm text-pink-600 font-medium">Solicitudes</p>
                    <p className="text-2xl font-bold text-pink-900 mt-1">{metrics.funnelMetrics.application_starts}</p>
                    <p className="text-xs text-pink-600 mt-1">{conversionRates.bank_to_application}%</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium">Leads Completos</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">{metrics.funnelMetrics.lead_completes}</p>
                    <p className="text-xs text-red-600 mt-1">{conversionRates.application_to_lead}%</p>
                  </div>
                </div>

                {/* Top fuentes */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Top 5 Fuentes de Tráfico</h4>
                  <div className="space-y-2">
                    {metrics.top_sources.slice(0, 5).map((source, idx) => (
                      <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-500">#{idx + 1}</span>
                          <span className="font-medium text-gray-900">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{source.users} usuarios</span>
                          <span className="text-sm font-semibold text-gray-900">{source.count} eventos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Embudo Completo */}
            {activeTab === 'funnel' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Embudo de Conversión Completo</h3>

                <div className="space-y-4">
                  {[
                    { label: 'Vistas al Landing Page', value: metrics.funnelMetrics.landing_page_views, rate: '100%', color: 'blue' },
                    { label: 'Registros (ConversionLandingPage)', value: metrics.funnelMetrics.registrations, rate: conversionRates.landing_to_registration + '%', color: 'indigo' },
                    { label: 'Perfil Completo', value: metrics.funnelMetrics.profile_completes, rate: conversionRates.registration_to_profile + '%', color: 'purple' },
                    { label: 'Perfilación Bancaria', value: metrics.funnelMetrics.bank_profiling_completes, rate: conversionRates.profile_to_bank + '%', color: 'pink' },
                    { label: 'Solicitud Iniciada', value: metrics.funnelMetrics.application_starts, rate: conversionRates.bank_to_application + '%', color: 'rose' },
                    { label: 'Lead Completo', value: metrics.funnelMetrics.lead_completes, rate: conversionRates.application_to_lead + '%', color: 'red' },
                  ].map((step, idx) => {
                    const percentage = metrics.funnelMetrics.landing_page_views > 0
                      ? (step.value / metrics.funnelMetrics.landing_page_views) * 100
                      : 0;

                    return (
                      <div key={step.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full bg-${step.color}-100 text-${step.color}-600 flex items-center justify-center text-sm font-semibold`}>
                              {idx + 1}
                            </span>
                            <span className="font-medium text-gray-900">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Conversión: {step.rate}</span>
                            <span className="text-lg font-bold text-gray-900">{step.value.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`bg-${step.color}-500 h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Embudo Meta */}
            {activeTab === 'meta-funnel' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Embudo Meta (Facebook/Instagram)</h3>

                <div className="space-y-4">
                  {[
                    { label: 'Vistas desde Meta', value: metrics.metaFunnelMetrics.meta_landing_views, rate: '100%' },
                    { label: 'Registros desde Meta', value: metrics.metaFunnelMetrics.meta_registrations, rate: metaConversionRates.landing_to_registration + '%' },
                    { label: 'Perfil Completo', value: metrics.metaFunnelMetrics.meta_profile_completes, rate: metaConversionRates.registration_to_profile + '%' },
                    { label: 'Perfilación Bancaria', value: metrics.metaFunnelMetrics.meta_bank_profiling_completes, rate: metaConversionRates.profile_to_bank + '%' },
                    { label: 'Solicitud Iniciada', value: metrics.metaFunnelMetrics.meta_application_starts, rate: metaConversionRates.bank_to_application + '%' },
                    { label: 'Lead Completo desde Meta', value: metrics.metaFunnelMetrics.meta_lead_completes, rate: metaConversionRates.application_to_lead + '%' },
                  ].map((step, idx) => {
                    const percentage = metrics.metaFunnelMetrics.meta_landing_views > 0
                      ? (step.value / metrics.metaFunnelMetrics.meta_landing_views) * 100
                      : 0;

                    return (
                      <div key={step.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{step.label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Conversión: {step.rate}</span>
                            <span className="text-lg font-bold text-gray-900">{step.value.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Fuentes */}
            {activeTab === 'sources' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Fuentes de Tráfico</h3>
                <div className="space-y-2">
                  {metrics.top_sources.map((source, idx) => (
                    <div key={source.source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-mono text-gray-500 w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{source.source}</p>
                          <p className="text-sm text-gray-600">{source.users} usuarios únicos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{source.count}</p>
                        <p className="text-sm text-gray-600">eventos totales</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Campañas */}
            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Campañas UTM</h3>
                {metrics.top_campaigns.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.top_campaigns.map((campaign, idx) => (
                      <div key={campaign.campaign} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-mono text-gray-500 w-8">#{idx + 1}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{campaign.campaign}</p>
                            <p className="text-sm text-gray-600">{campaign.users} usuarios únicos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{campaign.count}</p>
                          <p className="text-sm text-gray-600">eventos totales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay campañas con parámetros UTM en este período</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Páginas */}
            {activeTab === 'pages' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Páginas Más Vistas</h3>
                <div className="space-y-2">
                  {metrics.top_pages.map((page, idx) => (
                    <div key={page.page} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-lg font-mono text-gray-500 flex-shrink-0">#{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm text-gray-900 truncate">{page.page}</p>
                          <p className="text-sm text-gray-600">{page.unique_users} usuarios únicos</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-gray-900">{page.views}</p>
                        <p className="text-sm text-gray-600">vistas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Eventos */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Distribución de Eventos</h3>
                <div className="space-y-2">
                  {metrics.events_by_type.map((event, idx) => (
                    <div key={event.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{event.type}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{event.percentage.toFixed(1)}%</span>
                          <span className="text-lg font-bold text-gray-900">{event.count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${event.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingAnalyticsDashboardPage;
