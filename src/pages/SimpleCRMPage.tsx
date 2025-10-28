import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Loader2, AlertTriangle, User, Users, FileText, Clock, Search, Ban, Check, X, Edit2, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAILS = [
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
];

interface Lead {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    contactado: boolean;
    asesor_nombre: string | null;
    latest_app_status: string | null;
    latest_app_car_title: string | null;
    source: string | null;
    metadata: any | null;
    created_at: string | null;
    updated_at: string | null;
    last_sign_in_at: string | null;
}

type SortColumn = 'name' | 'email' | 'created_at' | 'updated_at' | 'last_sign_in_at' | 'status' | 'source';
type SortDirection = 'asc' | 'desc';

interface Stats {
    total_leads: number;
    leads_with_active_app: number;
    leads_with_unfinished_app: number;
    leads_needing_follow_up: number;
}

const SimpleCRMPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<Stats>({
        total_leads: 0,
        leads_with_active_app: 0,
        leads_with_unfinished_app: 0,
        leads_needing_follow_up: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSource, setEditingSource] = useState<string | null>(null);
    const [tempSource, setTempSource] = useState<string>('');
    const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Check if user is admin by email
    const isAdmin = useMemo(() => {
        if (!user?.email) return false;
        return ADMIN_EMAILS.includes(user.email);
    }, [user]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all profiles with their latest application info
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    contactado,
                    asesor_asignado_id,
                    source,
                    metadata,
                    created_at,
                    updated_at,
                    last_sign_in_at
                `)
                .eq('role', 'user')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            console.log('[SimpleCRM] Fetched profiles:', profilesData?.length);

            // Fetch latest application for each user
            const { data: applicationsData, error: applicationsError } = await supabase
                .from('financing_applications')
                .select('user_id, status, car_info, created_at')
                .in('status', ['submitted', 'reviewing', 'pending_docs', 'draft'])
                .order('created_at', { ascending: false });

            if (applicationsError) throw applicationsError;

            // Fetch asesor names
            const asesorIds = [...new Set(profilesData?.map(p => p.asesor_asignado_id).filter(Boolean) || [])];
            const { data: asesoresData } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', asesorIds);

            const asesorMap = new Map(
                asesoresData?.map(a => [a.id, `${a.first_name || ''} ${a.last_name || ''}`.trim()]) || []
            );

            // Create a map of latest application per user
            const latestAppMap = new Map();
            applicationsData?.forEach(app => {
                if (!latestAppMap.has(app.user_id)) {
                    latestAppMap.set(app.user_id, app);
                }
            });

            // Combine data
            const combinedLeads: Lead[] = (profilesData || []).map(profile => {
                const latestApp = latestAppMap.get(profile.id);
                return {
                    id: profile.id,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    email: profile.email,
                    phone: profile.phone,
                    contactado: profile.contactado || false,
                    asesor_nombre: asesorMap.get(profile.asesor_asignado_id) || null,
                    latest_app_status: latestApp?.status || null,
                    latest_app_car_title: latestApp?.car_info?._vehicleTitle || null,
                    source: profile.source,
                    metadata: profile.metadata,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at,
                    last_sign_in_at: profile.last_sign_in_at
                };
            });

            console.log('[SimpleCRM] Combined leads:', combinedLeads.length);
            console.log('[SimpleCRM] Sample lead:', combinedLeads[0]);

            setLeads(combinedLeads);

            // Calculate stats
            const totalLeads = combinedLeads.length;
            const leadsWithActiveApp = combinedLeads.filter(l =>
                ['submitted', 'reviewing', 'pending_docs'].includes(l.latest_app_status || '')
            ).length;
            const leadsWithUnfinishedApp = combinedLeads.filter(l =>
                l.latest_app_status === 'draft'
            ).length;
            const leadsNeedingFollowUp = combinedLeads.filter(l =>
                !l.contactado
            ).length;

            setStats({
                total_leads: totalLeads,
                leads_with_active_app: leadsWithActiveApp,
                leads_with_unfinished_app: leadsWithUnfinishedApp,
                leads_needing_follow_up: leadsNeedingFollowUp
            });

        } catch (err: any) {
            console.error('[SimpleCRM] Error fetching CRM data:', err);
            console.error('[SimpleCRM] Error details:', {
                message: err.message,
                code: err.code,
                details: err.details
            });
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setError('No estás autenticado');
            setIsLoading(false);
            return;
        }

        if (!isAdmin) {
            setError('No tienes permisos para acceder a esta página');
            setIsLoading(false);
            return;
        }

        fetchData();
    }, [user, isAdmin]);

    const toggleContactado = async (leadId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ contactado: !currentValue })
                .eq('id', leadId);

            if (error) throw error;

            setLeads(prev => prev.map(l =>
                l.id === leadId ? { ...l, contactado: !currentValue } : l
            ));

            toast.success(`Marcado como ${!currentValue ? 'contactado' : 'no contactado'}`);
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

            setLeads(prev => prev.map(l =>
                l.id === leadId ? { ...l, source: tempSource || null } : l
            ));

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

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRelativeTime = (dateString: string | null) => {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return formatDate(dateString);
    };

    const filteredAndSortedLeads = useMemo(() => {
        let filtered = leads;

        // Apply search filter
        if (searchTerm) {
            const lowercasedQuery = searchTerm.toLowerCase();
            filtered = leads.filter(lead =>
                `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
                lead.email?.toLowerCase().includes(lowercasedQuery) ||
                lead.source?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortColumn) {
                case 'name':
                    aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                    bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                    break;
                case 'email':
                    aVal = (a.email || '').toLowerCase();
                    bVal = (b.email || '').toLowerCase();
                    break;
                case 'created_at':
                    aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
                    bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
                    break;
                case 'updated_at':
                    aVal = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                    bVal = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                    break;
                case 'last_sign_in_at':
                    aVal = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
                    bVal = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
                    break;
                case 'status':
                    aVal = a.latest_app_status || '';
                    bVal = b.latest_app_status || '';
                    break;
                case 'source':
                    aVal = (a.source || '').toLowerCase();
                    bVal = (b.source || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [leads, searchTerm, sortColumn, sortDirection]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Sesión Requerida</h2>
                <p className="text-gray-600">Debes iniciar sesión para acceder a esta página</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Ban className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
                <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
                <p className="text-sm text-gray-500 mt-2">Email: {user.email}</p>
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

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
                <AlertTriangle className="inline w-5 h-5 mr-2"/>
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">CRM - Gestión de Leads</h1>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
                >
                    Refrescar Datos
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Total de Leads</p>
                            <p className="text-3xl font-bold text-blue-900">{stats.total_leads}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Con Solicitud Activa</p>
                            <p className="text-3xl font-bold text-purple-900">{stats.leads_with_active_app}</p>
                        </div>
                        <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-600">Solicitud Incompleta</p>
                            <p className="text-3xl font-bold text-yellow-900">{stats.leads_with_unfinished_app}</p>
                        </div>
                        <User className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
                <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Necesitan Seguimiento</p>
                            <p className="text-3xl font-bold text-red-900">{stats.leads_needing_follow_up}</p>
                        </div>
                        <Clock className="w-8 h-8 text-red-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Directorio de Clientes</h2>
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

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-1 hover:text-primary-600"
                                    >
                                        Nombre
                                        {sortColumn === 'name' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <button
                                        onClick={() => handleSort('email')}
                                        className="flex items-center gap-1 hover:text-primary-600"
                                    >
                                        Email / Teléfono
                                        {sortColumn === 'email' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">Último Auto de Interés</th>
                                <th scope="col" className="px-6 py-3">
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
                                <th scope="col" className="px-6 py-3">
                                    <button
                                        onClick={() => handleSort('source')}
                                        className="flex items-center gap-1 hover:text-primary-600"
                                    >
                                        Fuente
                                        {sortColumn === 'source' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">
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
                                <th scope="col" className="px-6 py-3">Contactado</th>
                                <th scope="col" className="px-6 py-3">Asesor</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedLeads.map(lead => (
                                <tr key={lead.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="truncate w-48" title={lead.email || ''}>{lead.email || '-'}</div>
                                        <div className="text-xs text-gray-400">{lead.phone || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">{lead.latest_app_car_title || '-'}</td>
                                    <td className="px-6 py-4">
                                        {lead.latest_app_status ? (
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full animate-pulse ${
                                                    lead.latest_app_status === 'submitted' ? 'bg-blue-500' :
                                                    lead.latest_app_status === 'reviewing' ? 'bg-purple-500' :
                                                    lead.latest_app_status === 'pending_docs' ? 'bg-yellow-500' :
                                                    lead.latest_app_status === 'approved' ? 'bg-green-500' :
                                                    lead.latest_app_status === 'draft' ? 'bg-gray-400' :
                                                    'bg-gray-400'
                                                }`}></span>
                                                <span className={`font-bold text-sm ${
                                                    lead.latest_app_status === 'submitted' ? 'text-blue-700' :
                                                    lead.latest_app_status === 'reviewing' ? 'text-purple-700' :
                                                    lead.latest_app_status === 'pending_docs' ? 'text-yellow-700' :
                                                    lead.latest_app_status === 'approved' ? 'text-green-700' :
                                                    lead.latest_app_status === 'draft' ? 'text-gray-600' :
                                                    'text-gray-600'
                                                }`}>
                                                    {lead.latest_app_status === 'submitted' ? 'Enviada' :
                                                    lead.latest_app_status === 'reviewing' ? 'En Revisión' :
                                                    lead.latest_app_status === 'pending_docs' ? 'Docs Pendientes' :
                                                    lead.latest_app_status === 'approved' ? 'Aprobada' :
                                                    lead.latest_app_status === 'draft' ? 'Borrador' :
                                                    lead.latest_app_status}
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingSource === lead.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={tempSource}
                                                    onChange={e => setTempSource(e.target.value)}
                                                    className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Ej: WhatsApp"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveSource(lead.id)}
                                                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEditingSource}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="truncate" title={lead.source || '-'}>
                                                    {lead.source || '-'}
                                                </span>
                                                <button
                                                    onClick={() => startEditingSource(lead.id, lead.source)}
                                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs ${!lead.last_sign_in_at ? 'text-gray-400 italic' : ''}`} title={formatDate(lead.last_sign_in_at)}>
                                            {formatRelativeTime(lead.last_sign_in_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={lead.contactado}
                                            onChange={() => toggleContactado(lead.id, lead.contactado)}
                                            className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">{lead.asesor_nombre || 'Sin asignar'}</td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/escritorio/admin/cliente/${lead.id}`}
                                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Ver perfil
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredAndSortedLeads.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No se encontraron resultados
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimpleCRMPage;
