import React from 'react';
import { Users, TrendingUp, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const DashboardExample: React.FC = () => {
    // Example data - replace with real data from your API
    const recentApplications = [
        { id: 1, customer: 'Juan Pérez', vehicle: 'Honda Civic 2020', amount: '$250,000', status: 'pending' },
        { id: 2, customer: 'María García', vehicle: 'Toyota Corolla 2021', amount: '$280,000', status: 'approved' },
        { id: 3, customer: 'Carlos López', vehicle: 'Mazda 3 2019', amount: '$220,000', status: 'reviewing' },
        { id: 4, customer: 'Ana Martínez', vehicle: 'Nissan Sentra 2020', amount: '$240,000', status: 'approved' },
        { id: 5, customer: 'Pedro Rodríguez', vehicle: 'Ford Focus 2018', amount: '$200,000', status: 'pending' },
    ];

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        'pending': 'outline',
        'approved': 'default',
        'reviewing': 'secondary',
        'rejected': 'destructive',
    };

    const statusLabels: Record<string, string> = {
        'pending': 'Pendiente',
        'approved': 'Aprobado',
        'reviewing': 'En Revisión',
        'rejected': 'Rechazado',
    };

    return (
        <div className="flex-1 space-y-4 md:space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Resumen de tus actividades y métricas
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button>Descargar Reporte</Button>
                </div>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Reportes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Total de Leads"
                            value="2,450"
                            change="+20.1% del mes pasado"
                            changeType="increase"
                            icon={Users}
                            color="orange"
                            description="Total de leads activos"
                        />
                        <StatsCard
                            title="Solicitudes Aprobadas"
                            value="1,234"
                            change="+15.3% del mes pasado"
                            changeType="increase"
                            icon={TrendingUp}
                            color="green"
                            description="Aprobaciones este mes"
                        />
                        <StatsCard
                            title="Ventas Totales"
                            value="$3.2M"
                            change="+8.2% del mes pasado"
                            changeType="increase"
                            icon={DollarSign}
                            color="blue"
                            description="Ingresos totales"
                        />
                        <StatsCard
                            title="Tasa de Conversión"
                            value="68.5%"
                            change="-2.4% del mes pasado"
                            changeType="decrease"
                            icon={Activity}
                            color="purple"
                            description="Leads a clientes"
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Recent Applications Table */}
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Solicitudes Recientes</CardTitle>
                                <CardDescription>
                                    Últimas solicitudes de financiamiento
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Vehículo</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentApplications.map((app) => (
                                            <TableRow key={app.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {app.customer.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{app.customer}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {app.vehicle}
                                                </TableCell>
                                                <TableCell className="font-medium">{app.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusColors[app.status]}>
                                                        {statusLabels[app.status]}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Recent Sales */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Ventas Recientes</CardTitle>
                                <CardDescription>
                                    Realizaste 265 ventas este mes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {[
                                        { name: 'Olivia Martin', email: 'olivia@example.com', amount: '+$1,999.00' },
                                        { name: 'Jackson Lee', email: 'jackson@example.com', amount: '+$2,499.00' },
                                        { name: 'Isabella Nguyen', email: 'isabella@example.com', amount: '+$1,799.00' },
                                        { name: 'William Kim', email: 'will@example.com', amount: '+$3,299.00' },
                                        { name: 'Sofia Davis', email: 'sofia@example.com', amount: '+$2,199.00' },
                                    ].map((sale, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>
                                                    {sale.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">{sale.name}</p>
                                                <p className="text-sm text-muted-foreground">{sale.email}</p>
                                            </div>
                                            <div className="font-medium">{sale.amount}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Cards Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Inventario Activo
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">573</div>
                                <p className="text-xs text-muted-foreground">
                                    +48 vehículos esta semana
                                </p>
                                <div className="mt-4 flex items-center text-sm">
                                    <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                                    <span className="text-green-500 font-medium">12%</span>
                                    <span className="ml-1 text-muted-foreground">vs mes anterior</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Tiempo Promedio de Venta
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">14.5 días</div>
                                <p className="text-xs text-muted-foreground">
                                    Desde publicación a venta
                                </p>
                                <div className="mt-4 flex items-center text-sm">
                                    <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                                    <span className="text-red-500 font-medium">-2.5 días</span>
                                    <span className="ml-1 text-muted-foreground">vs mes anterior</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Satisfacción del Cliente
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">4.8/5.0</div>
                                <p className="text-xs text-muted-foreground">
                                    Basado en 1,234 reseñas
                                </p>
                                <div className="mt-4 flex items-center text-sm">
                                    <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                                    <span className="text-green-500 font-medium">+0.3</span>
                                    <span className="ml-1 text-muted-foreground">vs mes anterior</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>
                                Vista detallada de métricas y análisis
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                                Gráficas y análisis detallados aquí
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reportes</CardTitle>
                            <CardDescription>
                                Genera y descarga reportes personalizados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                                Generador de reportes aquí
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DashboardExample;
