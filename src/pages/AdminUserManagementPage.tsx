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
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import CreateUserModal from '../components/CreateUserModal';
import UserAnalyticsModal from '../components/UserAnalyticsModal';

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
    is_overloaded: boolean;
    is_active: boolean;
}

const AdminUserManagementPage: React.FC = () => {
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
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (user: SalesUser) => {
        if (!user.is_active) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactivo
                </span>
            );
        }
        if (user.is_overloaded) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Sobrecargado
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Activo
            </span>
        );
    };

    const getActivityBadge = (lastSignIn: string | null) => {
        if (!lastSignIn) return (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                Sin actividad
            </span>
        );

        const date = new Date(lastSignIn);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                    En línea
                </span>
            );
        } else if (diffDays <= 7) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                    Activo
                </span>
            );
        } else if (diffDays <= 30) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700">
                    Poco activo
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                    Inactivo
                </span>
            );
        }
    };

    const totalLeads = salesUsers.reduce((sum, user) => sum + user.leads_assigned, 0);
    const totalContacted = salesUsers.reduce((sum, user) => sum + user.leads_contacted, 0);
    const totalApplications = salesUsers.reduce((sum, user) => sum + user.leads_with_applications, 0);
    const activeUsers = salesUsers.filter(user => user.is_active).length;
    const overloadedUsers = salesUsers.filter(user => user.is_overloaded).length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
                <AlertTriangle className="inline w-5 h-5 mr-2" />
                {error?.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-600 mt-1">
                        Administra el equipo de ventas y monitorea su desempeño
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <UserPlus className="w-5 h-5" />
                    Crear Usuario de Ventas
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Usuarios</p>
                            <p className="text-2xl font-bold text-gray-900">{salesUsers.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Usuarios Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Activity className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Leads Totales</p>
                            <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Contactados</p>
                            <p className="text-2xl font-bold text-gray-900">{totalContacted}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Sobrecargados</p>
                            <p className="text-2xl font-bold text-gray-900">{overloadedUsers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actividad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leads
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Métricas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salesUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span className="text-primary-700 font-semibold">
                                                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Desde {formatDate(user.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center">
                                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                            {user.email}
                                        </div>
                                        {user.phone && (
                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                {user.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(user)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            {getActivityBadge(user.last_sign_in_at)}
                                            <div className="text-xs text-gray-500">
                                                Última sesión: {formatDate(user.last_sign_in_at)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">
                                                {user.leads_assigned} asignados
                                            </div>
                                            <div className="text-gray-500">
                                                Última asignación: {formatDate(user.last_assigned_at)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Contactados:</span>
                                                <span className="font-medium text-green-600">
                                                    {user.leads_contacted}/{user.leads_assigned}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Con solicitud:</span>
                                                <span className="font-medium text-blue-600">
                                                    {user.leads_with_applications}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary-600 h-2 rounded-full transition-all"
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedUserId(user.id)}
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Ver Detalles
                                            </button>
                                            <button
                                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                                className={`inline-flex items-center px-3 py-1 border rounded-md transition-colors ${user.is_active
                                                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                                    : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                                    }`}
                                                disabled={toggleUserStatusMutation.isPending}
                                            >
                                                {user.is_active ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
