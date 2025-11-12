import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, MousePointerClick,
  Calendar, Filter, Download, RefreshCw, ExternalLink, AlertCircle
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

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
  page_url?: string;
  referrer?: string;
  created_at?: string;
}

interface EventStats {
  total_events: number;
  unique_sessions: number;
  top_sources: Array<{ source: string; count: number }>;
  top_campaigns: Array<{ campaign: string; count: number }>;
  events_by_type: Array<{ type: string; count: number }>;
  events_over_time: Array<{ date: string; count: number }>;
}

const MarketingAnalyticsDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    eventType?: string;
    utmSource?: string;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'sources' | 'campaigns'>('overview');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query tracking_events table (same table marketing-config uses)
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.utmSource) {
        query = query.eq('utm_source', filters.utmSource);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error loading tracking events:', queryError);
        setError(`Error loading events: ${queryError.message}`);
        setEvents([]);
        setStats(null);
        return;
      }

      const eventsData = data || [];
      setEvents(eventsData);

      // Calculate stats
      const uniqueSessions = new Set(eventsData.map(e => e.session_id).filter(Boolean)).size;

      // Top sources
      const sourceCounts: Record<string, number> = {};
      eventsData.forEach(e => {
        const source = e.utm_source || 'direct';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top campaigns
      const campaignCounts: Record<string, number> = {};
      eventsData.forEach(e => {
        if (e.utm_campaign) {
          const campaign = e.utm_campaign;
          campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
        }
      });
      const topCampaigns = Object.entries(campaignCounts)
        .map(([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Events by type
      const typeCounts: Record<string, number> = {};
      eventsData.forEach(e => {
        typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
      });
      const eventsByType = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Events over time
      const dateMap: Record<string, number> = {};
      eventsData.forEach(e => {
        if (e.created_at) {
          const date = e.created_at.split('T')[0];
          dateMap[date] = (dateMap[date] || 0) + 1;
        }
      });
      const eventsOverTime = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        total_events: eventsData.length,
        unique_sessions: uniqueSessions,
        top_sources: topSources,
        top_campaigns: topCampaigns,
        events_by_type: eventsByType,
        events_over_time: eventsOverTime,
      });
    } catch (err: any) {
      console.error('Failed to load marketing data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.startDate, filters.endDate, filters.eventType, filters.utmSource]);

  const exportToCSV = () => {
    if (!events.length) return;

    const headers = ['Date', 'Event Type', 'Event Name', 'Page URL', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Referrer'];
    const rows = events.map(e => [
      e.created_at || '',
      e.event_type,
      e.event_name,
      e.page_url || '',
      e.utm_source || '',
      e.utm_medium || '',
      e.utm_campaign || '',
      e.referrer || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-events-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            Analytics de Marketing
          </h1>
          <p className="mt-2 text-gray-600">
            Visualiza eventos, referrers y rendimiento de campañas desde GTM y Facebook Pixel
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={exportToCSV}
            disabled={!events.length}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error cargando datos</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
            <input
              type="text"
              value={filters.eventType || ''}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value || undefined })}
              placeholder="Ej: PageView, Lead"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UTM Source</label>
            <input
              type="text"
              value={filters.utmSource || ''}
              onChange={(e) => setFilters({ ...filters, utmSource: e.target.value || undefined })}
              placeholder="Ej: google, facebook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_events.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sesiones Únicas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.unique_sessions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversiones</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.events_by_type.find(e => e.type.toLowerCase().includes('lead'))?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clics</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.events_by_type.find(e => e.type.toLowerCase().includes('click'))?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <MousePointerClick className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'events', label: 'Eventos', icon: Calendar },
            { id: 'sources', label: 'Fuentes', icon: ExternalLink },
            { id: 'campaigns', label: 'Campañas', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Eventos por Tipo</h3>
                  <div className="space-y-3">
                    {stats.events_by_type.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-64 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${(item.count / stats.total_events) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-16 text-right">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Eventos en el Tiempo</h3>
                  <div className="h-64 flex items-end justify-between gap-1">
                    {stats.events_over_time.slice(-30).map((item, idx) => {
                      const maxCount = Math.max(...stats.events_over_time.map(e => e.count));
                      const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors cursor-pointer"
                            style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                            title={`${item.date}: ${item.count} eventos`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Últimos 30 días</p>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Página</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTM Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaña</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.slice(0, 100).map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.created_at ? new Date(event.created_at).toLocaleString('es-MX') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {event.event_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {event.event_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{event.page_url || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.utm_source || 'direct'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.utm_campaign || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay eventos para mostrar</p>
                    <p className="text-sm mt-1">Ajusta los filtros o verifica que GTM esté enviando eventos</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sources' && stats && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">Top 10 Fuentes de Tráfico</h3>
                {stats.top_sources.length > 0 ? (
                  stats.top_sources.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">{item.source}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No hay datos de fuentes disponibles</div>
                )}
              </div>
            )}

            {activeTab === 'campaigns' && stats && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">Top 10 Campañas</h3>
                {stats.top_campaigns.length > 0 ? (
                  stats.top_campaigns.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">{item.campaign}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No hay datos de campañas disponibles</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketingAnalyticsDashboardPage;
