import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, DollarSign, BarChart3, Package, Car,
  AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight,
  ExternalLink, FileText, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MetricsService, type FunnelMetrics, type MetaFunnelMetrics, type SourceMetrics } from '../services/MetricsService';
import { BusinessAnalyticsService, type BusinessMetrics } from '../services/BusinessAnalyticsService';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface DashboardData {
  marketing: {
    funnel: FunnelMetrics;
    metaFunnel: MetaFunnelMetrics;
    sources: SourceMetrics[];
    totalVisits: number;
    uniqueVisitors: number;
  };
  business: BusinessMetrics;
}

export default function UnifiedAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [funnelMetrics, metaFunnelMetrics, sourceMetrics, totalVisits, uniqueVisitors, businessMetrics] = await Promise.all([
        MetricsService.getFunnelMetrics(dateRange.startDate, dateRange.endDate),
        MetricsService.getMetaFunnelMetrics(dateRange.startDate, dateRange.endDate),
        MetricsService.getSourceMetrics(dateRange.startDate, dateRange.endDate),
        MetricsService.getTotalSiteVisits(dateRange.startDate, dateRange.endDate),
        MetricsService.getUniqueSiteVisitors(dateRange.startDate, dateRange.endDate),
        BusinessAnalyticsService.getBusinessMetrics()
      ]);

      setData({
        marketing: {
          funnel: funnelMetrics,
          metaFunnel: metaFunnelMetrics,
          sources: sourceMetrics.slice(0, 10),
          totalVisits,
          uniqueVisitors
        },
        business: businessMetrics
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[UnifiedDashboard] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionRate = (converted: number, total: number) => {
    return total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Error al cargar datos</h2>
              <p className="text-sm text-muted-foreground">{error || 'Ocurrió un error desconocido'}</p>
              <Button onClick={() => loadAllData()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { marketing, business } = data;

  // Preparar datos para gráficas
  const funnelData = [
    { name: 'Landing Views', value: marketing.funnel.landing_page_views, fill: COLORS[0] },
    { name: 'Registros', value: marketing.funnel.registrations, fill: COLORS[1] },
    { name: 'Perfil Completo', value: marketing.funnel.profile_completes, fill: COLORS[2] },
    { name: 'Perfilación Bancaria', value: marketing.funnel.bank_profiling_completes, fill: COLORS[3] },
    { name: 'Solicitudes Iniciadas', value: marketing.funnel.application_starts, fill: COLORS[4] },
    { name: 'Leads Completos', value: marketing.funnel.lead_completes, fill: COLORS[0] }
  ];

  const topSources = marketing.sources.map(s => ({
    name: s.source,
    eventos: s.count,
    conversiones: s.conversions,
    tasa: parseFloat(s.conversionRate.toFixed(1))
  }));

  const conversionOverall = calculateConversionRate(marketing.funnel.lead_completes, marketing.funnel.landing_page_views);
  const landingToRegistration = calculateConversionRate(marketing.funnel.registrations, marketing.funnel.landing_page_views);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Vista unificada de métricas de marketing y negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Última actualización</p>
            <p className="font-medium">{lastUpdated.toLocaleTimeString('es-MX')}</p>
          </div>
          <Button variant="outline" size="icon" onClick={loadAllData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="business">Negocio</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(marketing.uniqueVisitors)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(marketing.totalVisits)} visitas totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversión Global</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionOverall}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {marketing.funnel.lead_completes} leads completos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes Activas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{business.totalActiveApplications}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {marketing.funnel.application_submissions} totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vehículos con Demanda</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Con solicitudes activas</p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Embudo de Conversión</CardTitle>
              <CardDescription>De visita a lead completo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/escritorio/admin/marketing-analytics">
                  <Button variant="outline" className="w-full justify-between">
                    Marketing Analytics Detallado
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/escritorio/admin/crm">
                  <Button variant="outline" className="w-full justify-between">
                    CRM y Gestión de Leads
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/escritorio/admin/solicitudes">
                  <Button variant="outline" className="w-full justify-between">
                    Analytics de Solicitudes
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 Fuentes de Tráfico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSources.slice(0, 5).map((source, idx) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {source.conversiones} conv. ({source.tasa}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Landing → Registro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{landingToRegistration}%</div>
                <p className="text-xs text-muted-foreground">
                  {marketing.funnel.registrations} de {marketing.funnel.landing_page_views}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Meta (Facebook/Instagram)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketing.metaFunnel.meta_registrations}</div>
                <p className="text-xs text-muted-foreground">
                  {marketing.metaFunnel.meta_lead_completes} leads completos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateConversionRate(
                    marketing.metaFunnel.meta_lead_completes,
                    marketing.metaFunnel.meta_landing_views
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">Conversión desde Meta</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas por Fuente</CardTitle>
              <CardDescription>Eventos, conversiones y tasas por fuente de tráfico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketing.sources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{source.source}</p>
                      <p className="text-sm text-muted-foreground">
                        {source.users} usuarios • {source.sessions} sesiones
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{source.count} eventos</p>
                      <p className="text-sm text-green-600">
                        {source.conversions} conv. ({source.conversionRate.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles del Embudo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Vistas Landing Page', value: marketing.funnel.landing_page_views },
                  { label: 'Registros', value: marketing.funnel.registrations },
                  { label: 'Perfil Completo', value: marketing.funnel.profile_completes },
                  { label: 'Perfilación Bancaria', value: marketing.funnel.bank_profiling_completes },
                  { label: 'Solicitudes Iniciadas', value: marketing.funnel.application_starts },
                  { label: 'Leads Completos', value: marketing.funnel.lead_completes }
                ].map((step, idx, arr) => {
                  const prevValue = idx > 0 ? arr[idx - 1].value : step.value;
                  const rate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={step.label} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{rate}%</span>
                        <span className="font-semibold">{formatNumber(step.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes Activas</CardTitle>
                <CardDescription>Aplicaciones en proceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{business.totalActiveApplications}</div>
                <p className="text-sm text-muted-foreground">
                  Requieren seguimiento y gestión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventario con Demanda</CardTitle>
                <CardDescription>Vehículos con solicitudes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  De {business.inventoryVehiclesWithApplications.length} vehículos totales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Unavailable Vehicles Alert */}
          {business.unavailableVehicleApplications.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Solicitudes con Vehículos No Disponibles
                </CardTitle>
                <CardDescription>
                  {business.unavailableVehicleApplications.length} solicitudes requieren atención
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {business.unavailableVehicleApplications.slice(0, 5).map((app) => (
                    <div key={app.applicationId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{app.vehicleTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.applicantName} • {app.applicantEmail}
                        </p>
                      </div>
                      <Badge variant="destructive">No disponible</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle>Vehículos con Más Solicitudes</CardTitle>
              <CardDescription>Top 10 vehículos más solicitados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {business.inventoryVehiclesWithApplications
                  .filter(v => v.ongoingApplications > 0)
                  .sort((a, b) => b.ongoingApplications - a.ongoingApplications)
                  .slice(0, 10)
                  .map((vehicle, idx) => (
                    <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <div>
                          <p className="font-medium">{vehicle.vehicleTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Orden de compra: {vehicle.ordenCompra}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{vehicle.ongoingApplications}</p>
                        <p className="text-xs text-muted-foreground">solicitudes</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
