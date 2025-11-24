import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnalyticsService, DashboardMetrics, TrendComparisons, DashboardFilters } from '../services/AnalyticsService';
import { BrevoEmailService } from '../services/BrevoEmailService';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import SourcePieChart from '../components/dashboard/SourcePieChart';
import ConversionFunnel from '../components/dashboard/ConversionFunnel';
import FilterPanel from '../components/dashboard/FilterPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
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
    Zap,
    FileCheck,
    FileX
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

    // Filter state with default values (all time - no date restrictions)
    const [filters, setFilters] = useState<DashboardFilters>({
        dateRange: 'all',
        startDate: undefined,
        endDate: undefined,
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
            dateRange: 'all',
            startDate: undefined,
            endDate: undefined,
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground mb-4">No se pudieron cargar los datos del dashboard</p>
                        <Button onClick={handleManualRefresh}>
                            Reintentar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isAdmin ? 'Dashboard Administrativo' : 'Dashboard de Ventas'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Bienvenido, {userName}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Última actualización</p>
                        <p className="text-sm font-medium">
                            {lastUpdated.toLocaleTimeString('es-MX')}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
            />

            {/* 24-Hour Metric */}
            <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Zap className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Últimas 24 Horas
                                </p>
                                <h3 className="text-3xl font-bold">
                                    {metrics.completedLast24Hours}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Solicitudes completadas (Aprobadas + Completadas)
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline">
                            {lastUpdated.toLocaleTimeString('es-MX')}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                    title="Solicitudes Totales"
                    value={metrics.totalApplications}
                    icon={<FileText className="h-4 w-4" />}
                    trendPercent={trends?.applicationsChangePercent}
                    onClick={() => navigate('/escritorio/mis-aplicaciones')}
                />
                <MetricCard
                    title="En Cola/Pendientes"
                    value={metrics.pendingApplications}
                    icon={<Clock className="h-4 w-4" />}
                    description={`${((metrics.pendingApplications / (metrics.totalApplications || 1)) * 100).toFixed(0)}% del total`}
                />
                <MetricCard
                    title="Procesadas"
                    value={metrics.processedApplications}
                    icon={<BarChart3 className="h-4 w-4" />}
                />
                <MetricCard
                    title="Aprobadas"
                    value={metrics.approvedApplications}
                    icon={<CheckCircle className="h-4 w-4" />}
                    description={`${metrics.approvalRate}% tasa de aprobación`}
                    variant="success"
                />
                <MetricCard
                    title="Enviadas con Documentos"
                    value={metrics.submittedWithDocuments}
                    icon={<FileCheck className="h-4 w-4" />}
                    description="Solicitudes completas"
                    variant="success"
                />
                <MetricCard
                    title="Enviadas sin Documentos"
                    value={metrics.submittedWithoutDocuments}
                    icon={<FileX className="h-4 w-4" />}
                    description="Requieren documentos"
                    variant="destructive"
                />
            </div>

            {/* Website Leads */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Leads del Sitio Web
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <MetricCard
                            title="Total de Leads Web"
                            value={metrics.websiteLeads.total}
                            icon={<Users className="h-4 w-4" />}
                            trendPercent={trends?.leadsChangePercent}
                            onClick={() => navigate(isAdmin ? '/escritorio/admin/crm' : '/escritorio/ventas/crm')}
                        />
                        <MetricCard
                            title="Leads Contactados"
                            value={metrics.websiteLeads.contacted}
                            icon={<MessageSquare className="h-4 w-4" />}
                            description={`${((metrics.websiteLeads.contacted / (metrics.websiteLeads.total || 1)) * 100).toFixed(0)}% contactados`}
                            variant="success"
                        />
                        <MetricCard
                            title="Sin Contactar"
                            value={metrics.websiteLeads.uncontacted}
                            icon={<Clock className="h-4 w-4" />}
                            variant={metrics.websiteLeads.uncontacted > 10 ? "destructive" : "default"}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Kommo CRM Leads */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Leads de Kommo CRM
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <MetricCard
                            title="Total de Leads Kommo"
                            value={metrics.kommoLeads.total}
                            icon={<Users className="h-4 w-4" />}
                        />
                        <MetricCard
                            title="Leads Activos"
                            value={metrics.kommoLeads.active}
                            icon={<CheckCircle className="h-4 w-4" />}
                            description={`${((metrics.kommoLeads.active / (metrics.kommoLeads.total || 1)) * 100).toFixed(0)}% activos`}
                            variant="success"
                        />
                        <MetricCard
                            title="Leads Eliminados"
                            value={metrics.kommoLeads.deleted}
                            icon={<Clock className="h-4 w-4" />}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Tasa de Conversión
                        </CardTitle>
                        <CardDescription>Leads a Solicitudes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.conversionRate}%</div>
                        {trends?.conversionChangePercent !== undefined && trends.conversionChangePercent !== 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                {trends.conversionChangePercent > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${trends.conversionChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {trends.conversionChangePercent > 0 ? '+' : ''}{trends.conversionChangePercent.toFixed(1)}% vs anterior
                                </span>
                            </div>
                        )}
                        <div className="mt-4 w-full bg-secondary rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Tasa de Aprobación
                        </CardTitle>
                        <CardDescription>Solicitudes Aprobadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.approvalRate}%</div>
                        {trends?.approvalChangePercent !== undefined && trends.approvalChangePercent !== 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                {trends.approvalChangePercent > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${trends.approvalChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {trends.approvalChangePercent > 0 ? '+' : ''}{trends.approvalChangePercent.toFixed(1)}% vs anterior
                                </span>
                            </div>
                        )}
                        <div className="mt-4 w-full bg-secondary rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(metrics.approvalRate, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Source Attribution */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Atribución por Fuente</CardTitle>
                        <Badge variant="secondary">{metrics.totalLeads} Total</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <SourceCard name="Facebook" count={metrics.sourceBreakdown.facebook} total={metrics.totalLeads} icon={<Facebook className="h-4 w-4" />} />
                        <SourceCard name="Google" count={metrics.sourceBreakdown.google} total={metrics.totalLeads} icon={<Globe className="h-4 w-4" />} />
                        <SourceCard name="Bot/WhatsApp" count={metrics.sourceBreakdown.bot} total={metrics.totalLeads} icon={<Bot className="h-4 w-4" />} />
                        <SourceCard name="Directo" count={metrics.sourceBreakdown.direct} total={metrics.totalLeads} icon={<MousePointerClick className="h-4 w-4" />} />
                        <SourceCard name="Otros" count={metrics.sourceBreakdown.other} total={metrics.totalLeads} icon={<Globe className="h-4 w-4" />} />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Charts, Activity, and Emails */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="charts">Gráficas y Análisis</TabsTrigger>
                    <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
                    <TabsTrigger value="emails">Historial de Emails</TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="space-y-4">
                    {/* Top Row: Full-width Trend Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tendencia de 30 Días</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeSeriesData.length > 0 ? (
                                <div className="w-full min-h-[280px]">
                                    <TrendLineChart data={timeSeriesData} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center min-h-[280px] text-muted-foreground">
                                    <p className="text-sm">Cargando datos de tendencias...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bottom Row: Two-column Grid for Distribution and Funnel */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribución de Fuentes</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <div className="w-full max-w-md aspect-square">
                                    <SourcePieChart data={metrics.sourceBreakdown} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pipeline de Conversión</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ConversionFunnel metrics={{
                                    totalLeads: metrics.totalLeads,
                                    contactedLeads: metrics.contactedLeads,
                                    totalApplications: metrics.totalApplications,
                                    processedApplications: metrics.processedApplications,
                                    approvedApplications: metrics.approvedApplications
                                }} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Leads Web Recientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {metrics.recentLeads.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No hay leads web recientes</p>
                                    ) : (
                                        metrics.recentLeads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                onClick={() => navigate(isAdmin ? `/escritorio/admin/cliente/${lead.id}` : `/escritorio/ventas/cliente/${lead.id}`)}
                                                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {lead.first_name} {lead.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                                                </div>
                                                {lead.contactado ? (
                                                    <Badge variant="outline">Contactado</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Pendiente</Badge>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Solicitudes Recientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {metrics.recentApplications.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No hay solicitudes recientes</p>
                                    ) : (
                                        metrics.recentApplications.map((app) => (
                                            <div
                                                key={app.id}
                                                onClick={() => navigate(`/escritorio/aplicacion/${app.id}`)}
                                                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        Solicitud #{app.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(app.created_at).toLocaleDateString('es-MX')}
                                                    </p>
                                                </div>
                                                <StatusBadge status={app.status} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                Leads Kommo CRM Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {metrics.recentKommoLeads.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4 col-span-full">No hay leads de Kommo recientes</p>
                                ) : (
                                    metrics.recentKommoLeads.map((lead) => (
                                        <Card key={lead.id}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-medium text-sm flex-1">
                                                        {lead.name || `Lead #${lead.kommo_id}`}
                                                    </p>
                                                    {!lead.is_deleted && (
                                                        <Badge variant="outline">Activo</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    ID: {lead.kommo_id}
                                                </p>
                                                {lead.price > 0 && (
                                                    <p className="text-sm font-semibold">
                                                        ${lead.price.toLocaleString('es-MX')} MXN
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {new Date(lead.created_at).toLocaleDateString('es-MX')}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="emails" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Últimos Emails Enviados (Brevo)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {emailHistory.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No hay historial de emails disponible</p>
                                    <p className="text-xs mt-1">
                                        Los emails se registrarán automáticamente cuando se envíen
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {emailHistory.map((email, index) => (
                                        <div
                                            key={email.id || index}
                                            className="flex items-start gap-3 p-3 rounded-lg border"
                                        >
                                            <div className="p-2 bg-muted rounded">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-medium text-sm truncate">
                                                        {email.recipient_email || email.to || 'Sin destinatario'}
                                                    </p>
                                                    <Badge variant={
                                                        email.status === 'sent' || email.status === 'delivered' ? 'default' :
                                                        email.status === 'failed' ? 'destructive' : 'secondary'
                                                    }>
                                                        {email.status || 'unknown'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    {email.template_type || email.subject || 'Sin asunto'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(email.created_at || email.sent_at).toLocaleString('es-MX')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Tasks and Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Tareas y Recordatorios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Recordatorios pendientes</span>
                                <span className="text-2xl font-bold">{metrics.pendingReminders}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-muted-foreground">Tareas para hoy</span>
                                <span className="text-2xl font-bold">{metrics.tasksToday}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate(isAdmin ? '/escritorio/admin/crm' : '/escritorio/ventas/crm')}
                                className="justify-start"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Ver Leads
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/escritorio/mis-aplicaciones')}
                                className="justify-start"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Solicitudes
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/escritorio/seguimiento')}
                                className="justify-start"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Tracking
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/escritorio/autos')}
                                className="justify-start"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Inventario
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper Components

interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    description?: string;
    onClick?: () => void;
    trendPercent?: number;
    variant?: 'default' | 'success' | 'destructive';
}

function MetricCard({ title, value, icon, description, onClick, trendPercent, variant = 'default' }: MetricCardProps) {
    return (
        <Card className={onClick ? 'cursor-pointer hover:bg-accent transition-colors' : ''} onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {trendPercent !== undefined && trendPercent !== 0 && (
                    <Badge variant={trendPercent > 0 ? 'default' : 'secondary'}>
                        {trendPercent > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
                    </Badge>
                )}
                <div className={`${
                    variant === 'success' ? 'text-green-600' :
                    variant === 'destructive' ? 'text-red-600' :
                    'text-muted-foreground'
                }`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

interface SourceCardProps {
    name: string;
    count: number;
    total: number;
    icon: React.ReactNode;
}

function SourceCard({ name, count, total, icon }: SourceCardProps) {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

    return (
        <div className="text-center p-4 rounded-lg border bg-card">
            <div className="inline-flex p-2 rounded-lg bg-muted mb-2">
                {icon}
            </div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground mb-2">{name}</p>
            <Badge variant="secondary">{percentage}%</Badge>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        pending: { label: 'Pendiente', variant: 'secondary' },
        submitted: { label: 'Enviada', variant: 'default' },
        processing: { label: 'Procesando', variant: 'default' },
        processed: { label: 'Procesada', variant: 'default' },
        approved: { label: 'Aprobada', variant: 'default' },
        rejected: { label: 'Rechazada', variant: 'destructive' }
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
