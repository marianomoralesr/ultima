import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnalyticsService, DashboardMetrics, TrendComparisons, DashboardFilters } from '../services/AnalyticsService';
import { BrevoEmailService } from '../services/BrevoEmailService';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import SourcePieChart from '../components/dashboard/SourcePieChart';
import ConversionFunnel from '../components/dashboard/ConversionFunnel';
import FilterPanel from '../components/dashboard/FilterPanel';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import {
    BarChart3,
    Users,
    FileText,
    CheckCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    MessageSquare,
    Calendar,
    ExternalLink,
    RefreshCw,
    Facebook,
    Globe,
    Bot,
    MousePointerClick,
    Mail,
    Zap
} from 'lucide-react';

export default function AdminSalesDashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
    const [trends, setTrends] = useState<TrendComparisons | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [emailHistory, setEmailHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'charts' | 'activity' | 'emails'>('charts');

    // Filter state with default values (last 30 days)
    const [filters, setFilters] = useState<DashboardFilters>({
        dateRange: 'last30days',
        startDate: startOfDay(subDays(new Date(), 30)),
        endDate: endOfDay(new Date()),
        source: 'all',
        status: 'all'
    });

    const isAdmin = profile?.role === 'admin';
    const userName = profile?.first_name || user?.email?.split('@')[0] || 'Usuario';

    useEffect(() => {
        loadDashboardData();
        // Auto-refresh every 2 minutes
        const interval = setInterval(() => {
            loadDashboardData(true);
        }, 120000);

        return () => clearInterval(interval);
    }, [user?.id, profile?.role, filters]);

    const loadDashboardData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            // Fetch all data in parallel for performance
            const [metricsData, chartData, trendData, emailData] = await Promise.all([
                AnalyticsService.getDashboardMetrics(user?.id, profile?.role, filters),
                AnalyticsService.getTimeSeriesData(user?.id, profile?.role),
                AnalyticsService.getTrendComparisons(user?.id, profile?.role, 7),
                BrevoEmailService.getRecentEmailHistory(15)
            ]);

            // Update state with fetched data
            setMetrics(metricsData);
            setEmailHistory(emailData);

            // Transform time series data for charts
            if (chartData.labels && chartData.labels.length > 0) {
                const transformedData = chartData.labels.map((label, i) => ({
                    label,
                    leads: chartData.leadsData[i] || 0,
                    applications: chartData.applicationsData[i] || 0
                }));
                setTimeSeriesData(transformedData);
            }

            setTrends(trendData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('[Dashboard] Error loading metrics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            dateRange: 'last30days',
            startDate: startOfDay(subDays(new Date(), 30)),
            endDate: endOfDay(new Date()),
            source: 'all',
            status: 'all'
        });
        // Trigger a manual refresh
        loadDashboardData(true);
    };

    const handleManualRefresh = () => {
        loadDashboardData(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">No se pudieron cargar los datos del dashboard</p>
                    <button
                        onClick={handleManualRefresh}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard {isAdmin ? 'Administrativo' : 'de Ventas'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Bienvenido, {userName}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Última actualización</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {lastUpdated.toLocaleTimeString('es-MX')}
                                </p>
                            </div>
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                                title="Actualizar datos"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filter Panel */}
                <FilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                {/* 24-Hour Metric - PROMINENT AT TOP */}
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 border-2 border-green-400">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-full">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-medium uppercase tracking-wide mb-1">
                                        Últimas 24 Horas
                                    </h3>
                                    <p className="text-white text-3xl font-bold">
                                        {metrics.completedLast24Hours}
                                    </p>
                                    <p className="text-green-100 text-sm mt-1">
                                        Solicitudes completadas (Aprobadas + Completadas)
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white/80 text-xs">Tiempo real</div>
                                <div className="text-white text-sm font-semibold mt-1">
                                    {lastUpdated.toLocaleTimeString('es-MX')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Cards - COMPACT */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {/* Total Applications */}
                    <MetricCard
                        title="Solicitudes Totales"
                        value={metrics.totalApplications}
                        icon={<FileText className="w-6 h-6" />}
                        color="blue"
                        trendPercent={trends?.applicationsChangePercent}
                        onClick={() => navigate('/applications')}
                    />

                    {/* Pending Applications */}
                    <MetricCard
                        title="En Cola/Pendientes"
                        value={metrics.pendingApplications}
                        icon={<Clock className="w-6 h-6" />}
                        color="yellow"
                        subtitle={`${((metrics.pendingApplications / (metrics.totalApplications || 1)) * 100).toFixed(0)}% del total`}
                    />

                    {/* Processed Applications */}
                    <MetricCard
                        title="Procesadas"
                        value={metrics.processedApplications}
                        icon={<BarChart3 className="w-6 h-6" />}
                        color="purple"
                    />

                    {/* Approved Applications */}
                    <MetricCard
                        title="Aprobadas"
                        value={metrics.approvedApplications}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                        subtitle={`${metrics.approvalRate}% tasa de aprobación`}
                    />
                </div>

                {/* Lead Metrics - COMPACT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <MetricCard
                        title="Total de Leads"
                        value={metrics.totalLeads}
                        icon={<Users className="w-6 h-6" />}
                        color="indigo"
                        trendPercent={trends?.leadsChangePercent}
                        onClick={() => navigate('/leads')}
                    />

                    <MetricCard
                        title="Leads Contactados"
                        value={metrics.contactedLeads}
                        icon={<MessageSquare className="w-6 h-6" />}
                        color="green"
                        subtitle={`${((metrics.contactedLeads / (metrics.totalLeads || 1)) * 100).toFixed(0)}% contactados`}
                    />

                    <MetricCard
                        title="Sin Contactar"
                        value={metrics.uncontactedLeads}
                        icon={<Clock className="w-6 h-6" />}
                        color="red"
                        urgent={metrics.uncontactedLeads > 10}
                    />
                </div>

                {/* Performance Metrics - COMPACT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">Tasa de Conversión</h3>
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-blue-600">
                                {metrics.conversionRate}%
                            </span>
                            <span className="text-sm text-gray-500">Leads a Solicitudes</span>
                        </div>
                        {trends?.conversionChangePercent !== undefined && trends.conversionChangePercent !== 0 && (
                            <div className={`flex items-center gap-1 mt-2 ${trends.conversionChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trends.conversionChangePercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="text-sm font-semibold">
                                    {trends.conversionChangePercent > 0 ? '+' : ''}{trends.conversionChangePercent.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs período anterior</span>
                            </div>
                        )}
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">Tasa de Aprobación</h3>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-green-600">
                                {metrics.approvalRate}%
                            </span>
                            <span className="text-sm text-gray-500">Solicitudes Aprobadas</span>
                        </div>
                        {trends?.approvalChangePercent !== undefined && trends.approvalChangePercent !== 0 && (
                            <div className={`flex items-center gap-1 mt-2 ${trends.approvalChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trends.approvalChangePercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="text-sm font-semibold">
                                    {trends.approvalChangePercent > 0 ? '+' : ''}{trends.approvalChangePercent.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs período anterior</span>
                            </div>
                        )}
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(metrics.approvalRate, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Source Attribution - COMPACT */}
                <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Atribución por Fuente</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <SourceCard
                            name="Facebook"
                            count={metrics.sourceBreakdown.facebook}
                            total={metrics.totalLeads}
                            icon={<Facebook className="w-5 h-5" />}
                            color="blue"
                        />
                        <SourceCard
                            name="Google"
                            count={metrics.sourceBreakdown.google}
                            total={metrics.totalLeads}
                            icon={<Globe className="w-5 h-5" />}
                            color="red"
                        />
                        <SourceCard
                            name="Bot/WhatsApp"
                            count={metrics.sourceBreakdown.bot}
                            total={metrics.totalLeads}
                            icon={<Bot className="w-5 h-5" />}
                            color="green"
                        />
                        <SourceCard
                            name="Directo"
                            count={metrics.sourceBreakdown.direct}
                            total={metrics.totalLeads}
                            icon={<MousePointerClick className="w-5 h-5" />}
                            color="purple"
                        />
                        <SourceCard
                            name="Otros"
                            count={metrics.sourceBreakdown.other}
                            total={metrics.totalLeads}
                            icon={<Globe className="w-5 h-5" />}
                            color="gray"
                        />
                    </div>
                </div>

                {/* Tabs for Charts, Recent Activity, and Email History */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                    {/* Tab Headers */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('charts')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'charts'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📈 Gráficas y Análisis
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'activity'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            🔄 Actividad Reciente
                        </button>
                        <button
                            onClick={() => setActiveTab('emails')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'emails'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📧 Historial de Emails
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {/* Charts Tab */}
                        {activeTab === 'charts' && (
                            <div className="space-y-4">
                                {/* 30-Day Trends Chart - COMPACT */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Tendencia de 30 Días</h3>
                                    {timeSeriesData.length > 0 ? (
                                        <div style={{ height: '280px' }}>
                                            <TrendLineChart data={timeSeriesData} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-gray-400">
                                            <p>Cargando datos de tendencias...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Source Attribution with Pie Chart - COMPACT */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Distribución de Fuentes</h3>
                                    <SourcePieChart data={metrics.sourceBreakdown} height={280} />
                                </div>

                                {/* Conversion Funnel - COMPACT */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Pipeline de Conversión</h3>
                                    <ConversionFunnel metrics={{
                                        totalLeads: metrics.totalLeads,
                                        contactedLeads: metrics.contactedLeads,
                                        totalApplications: metrics.totalApplications,
                                        processedApplications: metrics.processedApplications,
                                        approvedApplications: metrics.approvedApplications
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Recent Leads */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Leads Recientes</h3>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {metrics.recentLeads.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No hay leads recientes</p>
                                        ) : (
                                            metrics.recentLeads.map((lead) => (
                                                <div
                                                    key={lead.id}
                                                    onClick={() => navigate(`/client/${lead.id}`)}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {lead.first_name} {lead.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{lead.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {lead.contactado ? (
                                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                                                Contactado
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                                                Pendiente
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Recent Applications */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Solicitudes Recientes</h3>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {metrics.recentApplications.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No hay solicitudes recientes</p>
                                        ) : (
                                            metrics.recentApplications.map((app) => (
                                                <div
                                                    key={app.id}
                                                    onClick={() => navigate(`/application/${app.id}`)}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            Solicitud #{app.id.slice(0, 8)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(app.created_at).toLocaleDateString('es-MX')}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={app.status} />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email History Tab */}
                        {activeTab === 'emails' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-gray-900">Últimos Emails Enviados (Brevo)</h3>
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                {emailHistory.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No hay historial de emails disponible</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Los emails se registrarán automáticamente cuando se envíen
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {emailHistory.map((email, index) => (
                                            <div
                                                key={email.id || index}
                                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Mail className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            {email.recipient_email || email.to || 'Sin destinatario'}
                                                        </p>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            email.status === 'sent' || email.status === 'delivered'
                                                                ? 'bg-green-100 text-green-700'
                                                                : email.status === 'failed'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {email.status || 'unknown'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-1">
                                                        {email.template_type || email.subject || 'Sin asunto'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(email.created_at || email.sent_at).toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks and Actions - COMPACT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">Tareas y Recordatorios</h3>
                            <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-600">Recordatorios pendientes</span>
                                <span className="text-2xl font-bold text-blue-600">{metrics.pendingReminders}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-gray-600">Tareas para hoy</span>
                                <span className="text-2xl font-bold text-orange-600">{metrics.tasksToday}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - COMPACT */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/leads')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Ver Leads</span>
                            </button>
                            <button
                                onClick={() => navigate('/applications')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Solicitudes</span>
                            </button>
                            <button
                                onClick={() => navigate('/tracking')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm font-medium">Tracking</span>
                            </button>
                            <button
                                onClick={() => navigate('/inventario')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Inventario</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Marketing Links - COMPACT */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-4 text-white mb-6">
                    <h3 className="text-base font-semibold mb-3">Enlaces de Marketing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="https://trefa.mx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">Portal Principal</span>
                        </a>
                        <a
                            href="https://trefa.mx/solicitud"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">Formulario de Solicitud</span>
                        </a>
                        <a
                            href="https://trefa.mx/inventario"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">Inventario Público</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components

interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
    subtitle?: string;
    urgent?: boolean;
    onClick?: () => void;
    trendPercent?: number;
}

function MetricCard({ title, value, icon, color, subtitle, urgent, onClick, trendPercent }: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
        indigo: 'bg-indigo-50 text-indigo-600'
    };

    const textColorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
        purple: 'text-purple-600',
        indigo: 'text-indigo-600'
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-lg shadow-sm p-3 border ${
                urgent ? 'border-red-300 ring-2 ring-red-200' : 'border-gray-200'
            } ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">{title}</h3>
            <p className={`text-2xl font-bold ${textColorClasses[color]}`}>{value}</p>
            {trendPercent !== undefined && trendPercent !== 0 && (
                <div className={`flex items-center gap-1 mt-1 ${trendPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trendPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-xs font-semibold">
                        {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
                    </span>
                </div>
            )}
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}

interface SourceCardProps {
    name: string;
    count: number;
    total: number;
    icon: React.ReactNode;
    color: 'blue' | 'red' | 'green' | 'purple' | 'gray';
}

function SourceCard({ name, count, total, icon, color }: SourceCardProps) {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        gray: 'bg-gray-50 text-gray-600'
    };

    return (
        <div className="text-center">
            <div className={`inline-flex p-1.5 rounded-full ${colorClasses[color]} mb-1`}>
                {icon}
            </div>
            <p className="text-xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{name}</p>
            <p className="text-xs font-medium text-gray-600">{percentage}%</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
        submitted: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
        processing: { label: 'Procesando', className: 'bg-purple-100 text-purple-700' },
        processed: { label: 'Procesada', className: 'bg-indigo-100 text-indigo-700' },
        approved: { label: 'Aprobada', className: 'bg-green-100 text-green-700' },
        rejected: { label: 'Rechazada', className: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
        <span className={`text-xs px-2 py-1 rounded ${config.className}`}>
            {config.label}
        </span>
    );
}
