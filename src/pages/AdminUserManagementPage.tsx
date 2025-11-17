import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '../services/AdminService';
import {
    Loader2,
    AlertTriangle,
    UserPlus,
    Users,
    Activity,
    AlertCircle,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    Calendar,
    TrendingUp,
    Eye,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';
import CreateUserModal from '../components/CreateUserModal';
import UserAnalyticsModal from '../components/UserAnalyticsModal';
import ApplicationAnalyticsPanel from '../components/ApplicationAnalyticsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface SalesUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    created_at: string;
    last_sign_in_at: string;
    last_assigned_at: string;
    leads_assigned: number;
    leads_contacted: number;
    leads_with_applications: number;
    leads_actualizados: number;
    solicitudes_enviadas: number;
    solicitudes_procesadas: number;
    is_overloaded: boolean;
    is_active: boolean;
}

const AdminUserManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'applications'>('users');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: salesUsers = [], isLoading, isError, error } = useQuery<SalesUser[], Error>({
        queryKey: ['salesUsers'],
        queryFn: AdminService.getSalesUsersWithAnalytics
    });

    const toggleUserStatusMutation = useMutation({
        mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
            AdminService.updateSalesUserStatus(userId, isActive),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['salesUsers'] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const confirmMessage = newStatus
            ? '¿Desea activar este usuario? Comenzará a recibir leads automáticamente.'
            : '¿Desea desactivar este usuario? Dejará de recibir nuevos leads.';

        if (window.confirm(confirmMessage)) {
            toggleUserStatusMutation.mutate({ userId, isActive: newStatus });
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatRelativeTime = (dateString: string | null) => {
        if (!dateString) return 'Nunca';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);

        if (diffMin < 1) return 'hace unos segundos';
        if (diffMin < 60) return `hace ${diffMin} min${diffMin !== 1 ? 's' : ''}`;
        if (diffHour < 24) return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
        if (diffDay < 7) return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
        if (diffWeek < 4) return `hace ${diffWeek} semana${diffWeek !== 1 ? 's' : ''}`;
        if (diffMonth < 12) return `hace ${diffMonth} mes${diffMonth !== 1 ? 'es' : ''}`;

        return formatDate(dateString);
    };

    const getStatusBadge = (user: SalesUser) => {
        if (!user.is_active) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Inactivo
                </Badge>
            );
        }
        if (user.is_overloaded) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Sobrecargado
                </Badge>
            );
        }
        return (
            <Badge variant="default" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Activo
            </Badge>
        );
    };

    const getActivityBadge = (lastSignIn: string | null) => {
        if (!lastSignIn) return (
            <Badge variant="outline">Sin actividad</Badge>
        );

        const date = new Date(lastSignIn);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return <Badge variant="default">En línea</Badge>;
        } else if (diffDays <= 7) {
            return <Badge variant="secondary">Activo</Badge>;
        } else if (diffDays <= 30) {
            return <Badge variant="outline">Poco activo</Badge>;
        } else {
            return <Badge variant="destructive">Inactivo</Badge>;
        }
    };

    const totalLeads = salesUsers.reduce((sum, user) => sum + user.leads_assigned, 0);
    const totalContacted = salesUsers.reduce((sum, user) => sum + user.leads_contacted, 0);
    const totalApplications = salesUsers.reduce((sum, user) => sum + user.leads_with_applications, 0);
    const totalLeadsActualizados = salesUsers.reduce((sum, user) => sum + user.leads_actualizados, 0);
    const activeUsers = salesUsers.filter(user => user.is_active).length;
    const overloadedUsers = salesUsers.filter(user => user.is_overloaded).length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <Card className="border-destructive">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error?.message}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios y Solicitudes</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Administra el equipo de ventas y analiza las solicitudes
                    </p>
                </div>
                {activeTab === 'users' && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Crear Usuario de Ventas
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="w-4 h-4" />
                        Usuarios de Ventas
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Análisis de Solicitudes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    {/* Stats Overview */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{salesUsers.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeUsers}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalLeads}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Contactados</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalContacted}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Actualizados</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalLeadsActualizados}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sobrecargados</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overloadedUsers}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr className="border-b">
                                                <th className="px-6 py-3 text-left font-medium">Usuario</th>
                                                <th className="px-6 py-3 text-left font-medium">Estado</th>
                                                <th className="px-6 py-3 text-left font-medium">Actividad</th>
                                                <th className="px-6 py-3 text-left font-medium">Leads</th>
                                                <th className="px-6 py-3 text-left font-medium">Métricas</th>
                                                <th className="px-6 py-3 text-left font-medium">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {salesUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-accent transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <span className="text-sm font-semibold">
                                                                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {user.first_name} {user.last_name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Desde {formatDate(user.created_at)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(user)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            {getActivityBadge(user.last_sign_in_at)}
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(user.last_sign_in_at)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <div className="font-medium">
                                                                {user.leads_assigned} asignados
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Última: {formatDate(user.last_assigned_at)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between gap-4">
                                                                <span className="text-muted-foreground">Contactados:</span>
                                                                <span className="font-medium">
                                                                    {user.leads_contacted}/{user.leads_assigned}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between gap-4">
                                                                <span className="text-muted-foreground">Actualizados:</span>
                                                                <span className="font-medium">
                                                                    {user.leads_actualizados}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between gap-4">
                                                                <span className="text-muted-foreground">Procesadas:</span>
                                                                <span className="font-medium">
                                                                    {user.solicitudes_procesadas}/{user.solicitudes_enviadas}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                                                                <div
                                                                    className="bg-primary h-1.5 rounded-full transition-all"
                                                                    style={{
                                                                        width: `${user.leads_assigned > 0
                                                                            ? (user.leads_contacted / user.leads_assigned) * 100
                                                                            : 0
                                                                            }%`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedUserId(user.id)}
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                Ver
                                                            </Button>
                                                            <Button
                                                                variant={user.is_active ? "destructive" : "default"}
                                                                size="sm"
                                                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                                                disabled={toggleUserStatusMutation.isPending}
                                                            >
                                                                {user.is_active ? 'Desactivar' : 'Activar'}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="applications">
                    <ApplicationAnalyticsPanel />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['salesUsers'] });
                    setIsCreateModalOpen(false);
                }}
            />

            {selectedUserId && (
                <UserAnalyticsModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </div>
    );
};

export default AdminUserManagementPage;
