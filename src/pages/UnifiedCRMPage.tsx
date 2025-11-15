import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/AdminService';
import { SalesService } from '../services/SalesService';
import { ApplicationService } from '../services/ApplicationService';
import {
    Loader2, AlertTriangle, User, Users, FileText, Clock, Search, Filter,
    CheckCircle2, AlertCircle, TrendingUp, Phone, Mail, RefreshCw, ArrowUpDown,
    ArrowUp, ArrowDown, Edit2, Check, X, Ban
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import StatsCard from '../components/StatsCard';
import {
    processLeads,
    getStatusLabel,
    getStatusColor,
    getStatusEmoji,
    formatRelativeTime
} from '../utils/crmHelpers';

interface UnifiedCRMPageProps {
    userRole: 'admin' | 'sales';
}

type SortColumn = 'name' | 'last_sign_in_at' | 'status' | 'contactado';
type SortDirection = 'asc' | 'desc';

const UnifiedCRMPage: React.FC<UnifiedCRMPageProps> = ({ userRole }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterContactado, setFilterContactado] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
    const [sortColumn, setSortColumn] = useState<SortColumn>('last_sign_in_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [editingSource, setEditingSource] = useState<string | null>(null);
    const [tempSource, setTempSource] = useState<string>('');
    const [asesores, setAsesores] = useState<Array<{ id: string; name: string }>>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const queryClient = useQueryClient();

    // Determine which service and query keys to use based on role
    const isAdmin = userRole === 'admin';
    const leadsQueryKey = isAdmin ? ['adminLeads'] : ['salesLeads', user?.id];
    const statsQueryKey = isAdmin ? ['adminStats'] : ['salesStats', user?.id];

    // Fetch leads (role-specific)
    const { data: leads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: leadsQueryKey,
        queryFn: () => isAdmin ? AdminService.getAllLeads() : SalesService.getMyAssignedLeads(user?.id || ''),
        enabled: !!user?.id,
    });

    // Fetch stats (role-specific)
    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: statsQueryKey,
        queryFn: () => isAdmin ? AdminService.getDashboardStats() : SalesService.getMyLeadsStats(user?.id || ''),
        enabled: !!user?.id,
    });

    // Fetch asesores for admin
    React.useEffect(() => {
        if (isAdmin) {
            supabase
                .from('profiles')
                .select('id, first_name, last_name, email')
                .in('role', ['admin', 'sales'])
                .order('first_name')
                .then(({ data }) => {
                    const asesorList = (data || []).map(a => ({
                        id: a.id,
                        name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || 'Sin nombre'
                    }));
                    setAsesores(asesorList);
                });
        }
    }, [isAdmin]);

    // Process leads with corrected status and priority flags
    const processedLeads = useMemo(() => processLeads(leads), [leads]);

    // Apply filters and sorting
    const filteredAndSortedLeads = useMemo(() => {
        let filtered = processedLeads;

        // Search filter
        if (searchTerm) {
            const lowercasedQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(lead =>
                `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
                lead.email?.toLowerCase().includes(lowercasedQuery) ||
                lead.phone?.toLowerCase().includes(lowercasedQuery) ||
                lead.source?.toLowerCase().includes(lowercasedQuery) ||
                lead.utm_source?.toLowerCase().includes(lowercasedQuery) ||
                lead.utm_campaign?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(lead => lead.correctedStatus === filterStatus);
        }

        // Contactado filter
        if (filterContactado !== 'all') {
            filtered = filtered.filter(lead => {
                if (filterContactado === 'contacted') return lead.contactado === true;
                if (filterContactado === 'not_contacted') return lead.contactado === false;
                return true;
            });
        }

        // Priority filter
        if (filterPriority === 'needs_action') {
            filtered = filtered.filter(lead => lead.needsAction);
        }

        // Sorting
        const sorted = [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortColumn) {
                case 'name':
                    aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                    bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                    break;
                case 'last_sign_in_at':
                    aVal = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
                    bVal = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
                    break;
                case 'status':
                    // Sort by status with priority: pending_docs, submitted, reviewing, approved, draft, rejected
                    const statusPriority: Record<string, number> = {
                        'pending_docs': 1,
                        'submitted': 2,
                        'reviewing': 3,
                        'approved': 4,
                        'draft': 5,
                        'rejected': 6
                    };
                    aVal = statusPriority[a.correctedStatus || ''] || 999;
                    bVal = statusPriority[b.correctedStatus || ''] || 999;
                    break;
                case 'contactado':
                    // false (not contacted) should come first when sorting ascending
                    aVal = a.contactado ? 1 : 0;
                    bVal = b.contactado ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [processedLeads, searchTerm, filterStatus, filterContactado, filterPriority, sortColumn, sortDirection]);

    // Pagination logic
    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredAndSortedLeads.slice(startIndex, endIndex);
    }, [filteredAndSortedLeads, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize);

    const leadsNeedingAction = useMemo(() => {
        return processedLeads.filter(lead => lead.needsAction).length;
    }, [processedLeads]);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterContactado, filterPriority]);

    // Handlers
    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const toggleContactado = async (leadId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ contactado: !currentValue })
                .eq('id', leadId);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            await queryClient.invalidateQueries({ queryKey: statsQueryKey });

            toast.success(`Marcado como ${!currentValue ? 'contactado' : 'no contactado'}`);
        } catch (err: any) {
            console.error('Error toggling contactado:', err);
            toast.error(`Error: ${err.message}`);
        }
    };

    const updateApplicationStatus = async (lead: any, newStatus: string) => {
        if (!lead.latest_app_id) {
            toast.error('No hay solicitud para actualizar');
            return;
        }

        setUpdatingStatuses(prev => new Set(prev).add(lead.id));

        try {
            await ApplicationService.updateApplicationStatus(lead.latest_app_id, newStatus);

            // Show feedback based on status
            const feedbackMessages: Record<string, { title: string; description: string; type: 'success' | 'warning' | 'info' | 'error' }> = {
                'submitted': {
                    title: '✅ Solicitud marcada como Completa',
                    description: 'Asegúrate de que todos los documentos estén presentes.',
                    type: 'success'
                },
                'pending_docs': {
                    title: '⚠️ Faltan Documentos',
                    description: 'Contacta al cliente para solicitar los documentos faltantes.',
                    type: 'warning'
                },
                'reviewing': {
                    title: '📋 En Revisión',
                    description: 'La solicitud está siendo revisada.',
                    type: 'info'
                },
                'approved': {
                    title: '🎉 Solicitud Aprobada',
                    description: 'Contacta al cliente para informarle.',
                    type: 'success'
                },
                'rejected': {
                    title: '❌ Solicitud Rechazada',
                    description: 'Contacta al cliente para explicar la situación.',
                    type: 'error'
                }
            };

            const feedback = feedbackMessages[newStatus];
            if (feedback) {
                toast[feedback.type](feedback.title, {
                    description: feedback.description,
                    duration: newStatus === 'pending_docs' ? 5000 : 4000
                });
            } else {
                toast.success(`Estado actualizado a: ${getStatusLabel(newStatus)}`);
            }

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            await queryClient.invalidateQueries({ queryKey: statsQueryKey });
        } catch (err: any) {
            console.error('Status update failed:', err);
            toast.error(`Error al actualizar: ${err.message}`);
        } finally {
            setUpdatingStatuses(prev => {
                const next = new Set(prev);
                next.delete(lead.id);
                return next;
            });
        }
    };

    const updateAsesorAsignado = async (leadId: string, asesorId: string | null) => {
        if (!isAdmin) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ asesor_asignado_id: asesorId || null })
                .eq('id', leadId);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            toast.success(asesorId ? 'Asesor asignado correctamente' : 'Asesor removido');
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        }
    };

    const startEditingSource = (leadId: string, currentSource: string | null) => {
        setEditingSource(leadId);
        setTempSource(currentSource || '');
    };

    const saveSource = async (leadId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ source: tempSource || null })
                .eq('id', leadId);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            setEditingSource(null);
            toast.success('Fuente actualizada');
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        }
    };

    const cancelEditingSource = () => {
        setEditingSource(null);
        setTempSource('');
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: leadsQueryKey });
        queryClient.invalidateQueries({ queryKey: statsQueryKey });
    };

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Sesión Requerida</h2>
                <p className="text-gray-600">Debes iniciar sesión para acceder a esta página</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
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

    const profileBasePath = isAdmin ? '/escritorio/admin/cliente' : '/escritorio/ventas/cliente';

    return (
        <div className="space-y-6">
            {/* Priority Action Bar */}
            {leadsNeedingAction > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-900">
                                    {leadsNeedingAction} Lead{leadsNeedingAction > 1 ? 's' : ''} Necesitan Atención
                                </h3>
                                <p className="text-sm text-amber-700">
                                    Hay leads sin contactar o con solicitudes pendientes de actualización
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilterPriority('needs_action')}
                            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                            Ver Urgentes
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'CRM - Gestión de Leads' : 'Mis Leads Asignados'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isAdmin
                            ? 'Gestiona todos los leads y asigna asesores'
                            : 'Gestiona tus clientes asignados y da seguimiento a sus solicitudes'}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refrescar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title={isAdmin ? "Total de Leads" : "Mis Leads Totales"}
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
                    title="Solicitud Incompleta"
                    value={stats.leads_with_unfinished_app || stats.leads_not_contacted || 0}
                    change=""
                    changeType="neutral"
                    icon={User}
                    color="yellow"
                />
                <StatsCard
                    title="Necesitan Seguimiento"
                    value={leadsNeedingAction}
                    change=""
                    changeType="neutral"
                    icon={Clock}
                    color="red"
                />
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                {/* Search and Title */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isAdmin ? 'Directorio de Clientes' : 'Mis Clientes'}
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o fuente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>

                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-semibold"
                    >
                        <option value="all">Todos (Prioridad)</option>
                        <option value="needs_action">⚡ Necesitan Acción</option>
                    </select>

                    <select
                        value={filterContactado}
                        onChange={e => setFilterContactado(e.target.value)}
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="all">Todos (Contactado)</option>
                        <option value="not_contacted">No Contactados</option>
                        <option value="contacted">Contactados</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="all">Todos (Estado Solicitud)</option>
                        <option value="draft">{getStatusEmoji('draft')} Borrador</option>
                        <option value="submitted">{getStatusEmoji('submitted')} Completas</option>
                        <option value="pending_docs">{getStatusEmoji('pending_docs')} Faltan Docs</option>
                        <option value="reviewing">{getStatusEmoji('reviewing')} En Revisión</option>
                        <option value="approved">{getStatusEmoji('approved')} Aprobadas</option>
                        <option value="rejected">{getStatusEmoji('rejected')} Rechazadas</option>
                    </select>

                    {(searchTerm || filterStatus !== 'all' || filterContactado !== 'all' || filterPriority !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('all');
                                setFilterContactado('all');
                                setFilterPriority('all');
                            }}
                            className="text-sm px-3 py-1.5 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Limpiar Filtros
                        </button>
                    )}

                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length !== 1 ? 's' : ''}
                        </div>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            <option value={10}>10 por página</option>
                            <option value={25}>25 por página</option>
                            <option value={50}>50 por página</option>
                            <option value={100}>100 por página</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-4 py-3">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-1 hover:text-primary-600"
                                    >
                                        Cliente
                                        {sortColumn === 'name' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Fuente
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    <button
                                        onClick={() => handleSort('last_sign_in_at')}
                                        className="flex items-center gap-1 hover:text-primary-600"
                                    >
                                        Último Acceso
                                        {sortColumn === 'last_sign_in_at' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-1 hover:text-primary-600"
                                    >
                                        Estado Solicitud
                                        {sortColumn === 'status' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => handleSort('contactado')}
                                        className="flex items-center gap-1 hover:text-primary-600 mx-auto"
                                    >
                                        Contactado
                                        {sortColumn === 'contactado' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                {isAdmin && <th scope="col" className="px-4 py-3">Asesor</th>}
                                <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeads.length > 0 ? (
                                paginatedLeads.map(lead => {
                                    const statusColor = getStatusColor(lead.correctedStatus || '');
                                    const isUpdating = updatingStatuses.has(lead.id);

                                    return (
                                        <tr
                                            key={lead.id}
                                            className={`border-b hover:bg-gray-50 transition-colors ${lead.needsAction ? 'bg-amber-50/30' : 'bg-white'}`}
                                        >
                                            {/* Cliente (Name + Contact + Priority) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-start gap-3">
                                                    {/* Priority Indicator */}
                                                    <div className="mt-0.5">
                                                        {lead.needsAction ? (
                                                            <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" title="Necesita acción" />
                                                        ) : (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" title="Al día" />
                                                        )}
                                                    </div>

                                                    {/* Name and Contact */}
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <Link to={`${profileBasePath}/${lead.id}`} className="font-semibold text-gray-900 hover:text-primary-600 hover:underline truncate">
                                                            {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                                        </Link>
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <Mail className="w-3 h-3 text-gray-400" />
                                                            <span className="truncate max-w-[200px]" title={lead.email}>{lead.email}</span>
                                                        </div>
                                                        {lead.phone && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Phone className="w-3 h-3 text-gray-400" />
                                                                <span>{lead.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Fuente */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {lead.utm_campaign && (
                                                        <div className="text-xs font-semibold text-primary-700" title="Campaña">
                                                            {lead.utm_campaign}
                                                        </div>
                                                    )}
                                                    {lead.utm_source && (
                                                        <div className="text-xs text-gray-600" title="UTM Source">
                                                            <span className="text-gray-400">utm:</span> {lead.utm_source}
                                                        </div>
                                                    )}
                                                    {lead.source && !lead.utm_source && !lead.utm_campaign && (
                                                        <div className="text-xs text-gray-700" title="Source">
                                                            {lead.source}
                                                        </div>
                                                    )}
                                                    {!lead.utm_campaign && !lead.utm_source && !lead.source && (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Último Acceso */}
                                            <td className="px-4 py-4">
                                                <div className="text-xs text-gray-700" title={lead.last_sign_in_at ? new Date(lead.last_sign_in_at).toLocaleString('es-MX') : 'Nunca'}>
                                                    {formatRelativeTime(lead.last_sign_in_at)}
                                                </div>
                                                {lead.latest_app_car_info?._vehicleTitle && (
                                                    <div className="text-[10px] text-gray-500 mt-1 truncate max-w-[150px]" title={lead.latest_app_car_info._vehicleTitle}>
                                                        {lead.latest_app_car_info._vehicleTitle}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Estado Solicitud */}
                                            <td className="px-4 py-4">
                                                {lead.correctedStatus && lead.latest_app_id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <select
                                                            value={lead.correctedStatus}
                                                            onChange={(e) => updateApplicationStatus(lead, e.target.value)}
                                                            disabled={isUpdating}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 ${statusColor.bg} ${statusColor.text} ${statusColor.border} cursor-pointer hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]`}
                                                        >
                                                            <option value="draft">Borrador</option>
                                                            <option value="submitted">Completa</option>
                                                            <option value="pending_docs">Faltan Docs</option>
                                                            <option value="reviewing">En Revisión</option>
                                                            <option value="approved">Aprobada</option>
                                                            <option value="rejected">Rechazada</option>
                                                        </select>
                                                        {isUpdating && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                <span>Actualizando...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin solicitud</span>
                                                )}
                                            </td>

                                            {/* Contactado Checkbox */}
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={lead.contactado}
                                                    onChange={() => toggleContactado(lead.id, lead.contactado)}
                                                    className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                                />
                                            </td>

                                            {/* Asesor Assignment (admin only) */}
                                            {isAdmin && (
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={lead.asesor_asignado_id || ''}
                                                        onChange={(e) => updateAsesorAsignado(lead.id, e.target.value || null)}
                                                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer min-w-[130px]"
                                                    >
                                                        <option value="">Sin asignar</option>
                                                        {asesores.map(asesor => (
                                                            <option key={asesor.id} value={asesor.id}>
                                                                {asesor.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            )}

                                            {/* Actions */}
                                            <td className="px-4 py-4 text-center">
                                                <Link
                                                    to={`${profileBasePath}/${lead.id}`}
                                                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                                                >
                                                    Abrir
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || filterStatus !== 'all' || filterContactado !== 'all' || filterPriority !== 'all'
                                            ? 'No se encontraron leads con los filtros seleccionados.'
                                            : 'No hay leads disponibles.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="text-sm text-gray-600">
                            Página {currentPage} de {totalPages} • Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredAndSortedLeads.length)} de {filteredAndSortedLeads.length} leads
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>

                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-primary-600 text-white'
                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnifiedCRMPage;
