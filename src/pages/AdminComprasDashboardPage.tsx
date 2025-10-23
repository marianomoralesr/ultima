import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SellCarService } from '../services/SellCarService';
import { Loader2, AlertTriangle, Car, ShoppingCart, Clock, CheckCircle, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';

const AdminComprasDashboardPage: React.FC = () => {
    const { user, isSales } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: purchaseLeads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: ['purchaseLeads'],
        queryFn: SellCarService.getAllPurchaseLeads
    });

    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: ['comprasDashboardStats'],
        queryFn: SellCarService.getPurchaseDashboardStats
    });

    const filteredLeads = useMemo(() => {
        let filtered = purchaseLeads;

        if (isSales && user) {
            filtered = purchaseLeads.filter(lead => lead.asesor_asignado_id === user.id);
        }

        if (!searchTerm) return filtered;

        const lowercasedQuery = searchTerm.toLowerCase();
        return filtered.filter(lead =>
            `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
            lead.email?.toLowerCase().includes(lowercasedQuery) ||
            lead.vehicle_info?.toLowerCase().includes(lowercasedQuery)
        );
    }, [purchaseLeads, searchTerm, isSales, user]);

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    if (isError) return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error?.message}</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total de Compras" value={stats.total_leads || 0} change="" changeType="neutral" icon={ShoppingCart} color="blue" />
                <StatsCard title="En Inspección" value={stats.in_inspection || 0} change="" changeType="neutral" icon={Clock} color="yellow" />
                <StatsCard title="Oferta Enviada" value={stats.offer_made || 0} change="" changeType="neutral" icon={Car} color="purple" />
                <StatsCard title="Completados" value={stats.completed || 0} change="" changeType="neutral" icon={CheckCircle} color="green" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Autos para Comprar</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o vehículo..."
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
                                <th scope="col" className="px-6 py-3">Propietario</th>
                                <th scope="col" className="px-6 py-3">Email / Teléfono</th>
                                <th scope="col" className="px-6 py-3">Vehículo</th>
                                <th scope="col" className="px-6 py-3">Oferta Inicial</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                                <th scope="col" className="px-6 py-3">Contactado</th>
                                <th scope="col" className="px-6 py-3">Asesor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        <Link to={`/escritorio/admin/compras/${lead.id}`} className="hover:underline text-primary-600">
                                            {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="truncate w-48" title={lead.email}>{lead.email}</div>
                                        <div className="text-xs text-gray-400">{lead.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">{lead.vehicle_info || '-'}</td>
                                    <td className="px-6 py-4">
                                        {lead.suggested_offer ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(lead.suggested_offer) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(lead.status)}`}>
                                            {getStatusLabel(lead.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${lead.contacted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {lead.contacted ? 'Sí' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{lead.asesor_asignado || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        'draft': 'Borrador',
        'in_inspection': 'En Inspección',
        'offer_made': 'Oferta Enviada',
        'accepted': 'Aceptado',
        'rejected': 'Rechazado',
        'completed': 'Completado'
    };
    return labels[status] || status;
};

const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
        'draft': 'bg-gray-100 text-gray-800',
        'in_inspection': 'bg-yellow-100 text-yellow-800',
        'offer_made': 'bg-purple-100 text-purple-800',
        'accepted': 'bg-blue-100 text-blue-800',
        'rejected': 'bg-red-100 text-red-800',
        'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export default AdminComprasDashboardPage;
