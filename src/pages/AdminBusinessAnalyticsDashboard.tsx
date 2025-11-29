import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BusinessAnalyticsService, BusinessMetrics } from '../services/BusinessAnalyticsService';
import { BrevoEmailService } from '../services/BrevoEmailService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    Car,
    AlertTriangle,
    RefreshCw,
    Mail,
    Package,
    BarChart3,
    CheckCircle2,
    DollarSign,
    Users,
    TrendingUp
} from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Line, LineChart } from 'recharts';

const COLORS = ['#e2673d', '#2a9d8f', '#264653', '#e9c46a', '#f4a261'];

export default function AdminBusinessAnalyticsDashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        loadBusinessData();
    }, []);

    const loadBusinessData = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
                setError(null);
            } else {
                setRefreshing(true);
            }

            const businessMetrics = await BusinessAnalyticsService.getBusinessMetrics();
            setMetrics(businessMetrics);
            setLastUpdated(new Date());
            setError(null);
        } catch (error) {
            console.error('[Business Analytics Page] Error loading metrics:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setError(`Error cargando datos: ${errorMessage}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSendAvailabilityEmail = async (app: any) => {
        if (!window.confirm(`¿Enviar email a ${app.applicantName} notificando que el vehículo ya no está disponible?`)) {
            return;
        }

        try {
            setSendingEmail(app.applicationId);
            await BrevoEmailService.sendVehicleUnavailableEmail({
                email: app.applicantEmail,
                name: app.applicantName,
                vehicleTitle: app.vehicleTitle
            });
            alert('Email enviado exitosamente');
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error al enviar el email');
        } finally {
            setSendingEmail(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Cargando análisis de negocio...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">Error al cargar datos</h2>
                            <p className="text-sm text-muted-foreground mb-4">{error}</p>
                            <Button onClick={() => loadBusinessData(false)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reintentar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">No se pudieron cargar los datos</p>
                        <Button onClick={() => loadBusinessData(false)}>Reintentar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Análisis de Negocio</h2>
                    <p className="text-sm text-muted-foreground">
                        Análisis de vehículos, ventas y tendencias de mercado
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Última actualización</p>
                        <p className="text-sm font-medium">{lastUpdated.toLocaleTimeString('es-MX')}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => loadBusinessData(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solicitudes Activas</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalActiveApplications}</div>
                        <p className="text-xs text-muted-foreground">En proceso</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vehículos con Solicitudes</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Inventario con demanda</p>
                    </CardContent>
                </Card>
            </div>

            {/* Unavailable Vehicle Applications - Limited to first 5 */}
            {metrics.unavailableVehicleApplications.length > 0 && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Solicitudes con Vehículos No Disponibles
                        </CardTitle>
                        <CardDescription>
                            {metrics.unavailableVehicleApplications.length} aplicaciones requieren acción inmediata
                            {metrics.unavailableVehicleApplications.length > 5 && ' (mostrando las primeras 5)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {metrics.unavailableVehicleApplications.slice(0, 5).map(app => (
                                <div key={app.applicationId} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{app.vehicleTitle}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cliente: {app.applicantName} • {app.applicantEmail}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Solicitud: {new Date(app.createdAt).toLocaleDateString('es-MX')} • Estado: {app.status}
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleSendAvailabilityEmail(app)}
                                        disabled={sendingEmail === app.applicationId}
                                    >
                                        {sendingEmail === app.applicationId ? (
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Mail className="h-4 w-4 mr-2" />
                                        )}
                                        Notificar Cliente
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {metrics.unavailableVehicleApplications.length > 5 && (
                            <div className="mt-4 pt-4 border-t text-center">
                                <Button variant="outline" size="sm" asChild>
                                    <a href="/escritorio/admin/crm">
                                        Ver todas las {metrics.unavailableVehicleApplications.length} solicitudes
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Vehicle Insights and Inventory Side by Side */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Vehicle Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="h-5 w-5" />
                            Vehículos con Mayor Demanda
                        </CardTitle>
                        <CardDescription>Top 10 vehículos por solicitudes activas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metrics.vehicleInsights.length === 0 ? (
                            <div className="text-center py-12">
                                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-sm text-muted-foreground">No hay datos de solicitudes por vehículo aún</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {metrics.vehicleInsights.slice(0, 10).map((vehicle, index) => (
                                    <div key={vehicle.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                                        <div className="flex-shrink-0">
                                            {vehicle.thumbnail ? (
                                                <img src={vehicle.thumbnail} alt={vehicle.titulo} className="w-12 h-12 rounded object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                                    <Car className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="font-medium text-sm line-clamp-1">{vehicle.titulo}</p>
                                                <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                                    <span><span className="font-semibold">{vehicle.applicationCount}</span> sol.</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                                                    <span><span className="font-semibold">{vehicle.activeApplications}</span> act.</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                                                    <span><span className="font-semibold">{vehicle.conversionRate}%</span> conv.</span>
                                                </div>
                                                <Badge variant={vehicle.ordenstatus === 'Disponible' ? 'default' : 'secondary'} className="text-xs h-5">
                                                    {vehicle.ordenstatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inventory with Active Applications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Inventario con Solicitudes Activas
                        </CardTitle>
                        <CardDescription>Vehículos en inventario con aplicaciones en proceso</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metrics.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-sm text-muted-foreground">No hay vehículos con solicitudes activas</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {metrics.inventoryVehiclesWithApplications
                                    .filter(v => v.ongoingApplications > 0)
                                    .slice(0, 30)
                                    .map((vehicle) => (
                                        <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-xs font-mono text-muted-foreground shrink-0">#{String(vehicle.id).slice(0, 6)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{vehicle.titulo}</p>
                                                    <p className="text-xs text-muted-foreground">{vehicle.conversionRate}% conversión</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" asChild className="shrink-0">
                                                <a href={`/escritorio/admin/crm?vehicle=${vehicle.id}`}>
                                                    {vehicle.ongoingApplications} sol.
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Distribución por Rango de Precio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={metrics.priceRangeInsights}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.range}: ${entry.count}`}
                                    outerRadius={80}
                                    fill="#f97316"
                                    dataKey="count"
                                >
                                    {metrics.priceRangeInsights.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Promedio de Solicitudes por Rango
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={metrics.priceRangeInsights}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgApplications" fill="#f97316" name="Promedio de Solicitudes" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Lead Personas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Perfil de Leads y Tasas de Aprobación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {metrics.leadPersonaInsights.map(persona => (
                            <Card key={persona.civilStatus}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{persona.civilStatus}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Cantidad:</span>
                                        <span className="font-semibold">{persona.count}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Ingreso Prom:</span>
                                        <span className="font-semibold">${Math.round(persona.avgIncome).toLocaleString('es-MX')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tasa Aprobación:</span>
                                        <span className="font-semibold">{persona.approvalRate.toFixed(1)}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Conversion Rate Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tasa de Conversión por Rango de Precio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.conversionRateByPrice}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="range" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2} name="Tasa de Conversión" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
