import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SalesService } from '../services/SalesService';
import { Loader2, AlertTriangle, User, Users, FileText, Clock, Search, Tag, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';

const SalesLeadsDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterContactado, setFilterContactado] = useState<string>('all');

    const { data: leads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: ['salesLeads', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error("Usuario no autenticado");
            return SalesService.getMyAssignedLeads(user.id);
        },
        enabled: !!user?.id,
    });

    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: ['salesDashboardStats', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error("Usuario no autenticado");
            return SalesService.getMyLeadsStats(user.id);
        },
        enabled: !!user?.id,
    });

    const filteredLeads = useMemo(() => {
        let filtered = leads;

        // Filter by search term
        if (searchTerm) {
            const lowercasedQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(lead =>
                `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
                lead.email?.toLowerCase().includes(lowercasedQuery) ||
                lead.phone?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Filter by application status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(lead => lead.latest_app_status === filterStatus);
        }

        // Filter by contactado status
        if (filterContactado !== 'all') {
            filtered = filtered.filter(lead => {
                if (filterContactado === 'contacted') return lead.contactado === true;
                if (filterContactado === 'not_contacted') return lead.contactado === false;
                return true;
            });
        }

        return filtered;
    }, [leads, searchTerm, filterStatus, filterContactado]);

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

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
                <AlertTriangle className="inline w-5 h-5 mr-2"/>
                {error?.message}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Leads Asignados</h1>
                <p className="text-gray-600 mt-1">Gestiona tus clientes asignados y da seguimiento a sus solicitudes.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Mis Leads Totales"
                    value={stats.total_leads || 0}
                    change=""
                    changeType="neutral"
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Con Solicitud Activa"
                    value={stats.leads_with_active_app || 0}
                    change=""
                    changeType="neutral"
                    icon={FileText}
                    color="purple"
                />
                <StatsCard
                    title="Sin Contactar"
                    value={stats.leads_not_contacted || 0}
                    change=""
                    changeType="neutral"
                    icon={User}
                    color="yellow"
                />
                <StatsCard
                    title="Necesitan Seguimiento"
                    value={stats.leads_needing_follow_up || 0}
                    change=""
                    changeType="neutral"
                    icon={Clock}
                    color="red"
                />
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800">Mis Clientes</h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o teléfono..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filtros:</span>
                        </div>

                        <select
                            value={filterContactado}
                            onChange={e => setFilterContactado(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Todos (Contactado)</option>
                            <option value="not_contacted">No Contactados</option>
                            <option value="contacted">Contactados</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Todos (Estado Solicitud)</option>
                            <option value="draft">Borrador</option>
                            <option value="submitted">Enviada</option>
                            <option value="reviewing">En Revisión</option>
                            <option value="pending_docs">Docs Pendientes</option>
                            <option value="approved">Aprobada</option>
                            <option value="rejected">Rechazada</option>
                        </select>

                        {(searchTerm || filterStatus !== 'all' || filterContactado !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                    setFilterContactado('all');
                                }}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-gray-600">
                    Mostrando {filteredLeads.length} de {leads.length} leads
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Email / Teléfono</th>
                                <th scope="col" className="px-6 py-3">Último Auto de Interés</th>
                                <th scope="col" className="px-6 py-3">Estado Solicitud</th>
                                <th scope="col" className="px-6 py-3">Contactado</th>
                                <th scope="col" className="px-6 py-3">Acceso Autorizado</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map(lead => (
                                    <tr key={lead.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="truncate w-48" title={lead.email}>{lead.email}</div>
                                            <div className="text-xs text-gray-400">{lead.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate" title={lead.latest_app_car_info?._vehicleTitle}>
                                                {lead.latest_app_car_info?._vehicleTitle || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.latest_app_status ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {lead.latest_app_status}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.contactado ? (
                                                <div className="flex items-center gap-1 text-green-700">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">Sí</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-700">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">No</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.autorizar_asesor_acceso ? (
                                                <div className="flex items-center gap-1 text-green-700">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">Sí</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-yellow-700">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">No</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.autorizar_asesor_acceso ? (
                                                <Link
                                                    to={`/escritorio/ventas/cliente/${lead.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                                                >
                                                    Ver Perfil
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Acceso Restringido</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || filterStatus !== 'all' || filterContactado !== 'all'
                                            ? 'No se encontraron leads con los filtros seleccionados.'
                                            : 'No tienes leads asignados aún.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesLeadsDashboardPage;
