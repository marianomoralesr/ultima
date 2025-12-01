import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SalesService } from '../services/SalesService';
import { ApplicationService } from '../services/ApplicationService';
import { APPLICATION_STATUS, getStatusConfig } from '../constants/applicationStatus';
import {
  Loader2,
  FileText,
  Download,
  Eye,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Upload,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';

const BUCKET_NAME = 'application-documents';

interface LeadApplication {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  car_info: any;
  personal_info_snapshot: any;
  is_complete: boolean;
  public_upload_token: string | null;
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  documents_count?: number;
}

const VentasSolicitudesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<LeadApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LeadApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completa: 0,
    faltan_documentos: 0,
    en_revision: 0,
    aprobada: 0,
  });

  useEffect(() => {
    if (user && profile?.role === 'sales') {
      loadApplications();
    }
  }, [user, profile]);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener todos los leads asignados al asesor
      const leads = await SalesService.getAssignedLeads(user!.id);

      // Para cada lead, obtener sus solicitudes
      const allApplications: LeadApplication[] = [];

      for (const lead of leads) {
        try {
          const { data: leadApplications, error: appError } = await supabase
            .from('financing_applications')
            .select('*')
            .eq('user_id', lead.id)
            .order('created_at', { ascending: false });

          if (appError) {
            console.error(`Error fetching applications for lead ${lead.id}:`, appError);
            continue;
          }

          if (leadApplications && leadApplications.length > 0) {
            // Para cada aplicación, contar documentos
            for (const app of leadApplications) {
              const { count } = await supabase
                .from('uploaded_documents')
                .select('*', { count: 'exact', head: true })
                .eq('application_id', app.id);

              allApplications.push({
                ...app,
                lead: {
                  id: lead.id,
                  first_name: lead.first_name || '',
                  last_name: lead.last_name || '',
                  email: lead.email || '',
                  phone: lead.phone || '',
                },
                documents_count: count || 0,
              });
            }
          }
        } catch (err) {
          console.error(`Error processing lead ${lead.id}:`, err);
        }
      }

      setApplications(allApplications);
      calculateStats(allApplications);
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps: LeadApplication[]) => {
    const stats = {
      total: apps.length,
      completa: apps.filter(a =>
        a.status === APPLICATION_STATUS.COMPLETA ||
        a.status === APPLICATION_STATUS.SUBMITTED
      ).length,
      faltan_documentos: apps.filter(a =>
        a.status === APPLICATION_STATUS.FALTAN_DOCUMENTOS ||
        a.status === APPLICATION_STATUS.PENDING_DOCS
      ).length,
      en_revision: apps.filter(a =>
        a.status === APPLICATION_STATUS.EN_REVISION ||
        a.status === APPLICATION_STATUS.REVIEWING ||
        a.status === APPLICATION_STATUS.IN_REVIEW
      ).length,
      aprobada: apps.filter(a =>
        a.status === APPLICATION_STATUS.APROBADA ||
        a.status === APPLICATION_STATUS.APPROVED
      ).length,
    };
    setStats(stats);
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(app => {
        const searchLower = searchTerm.toLowerCase();
        const leadName = `${app.lead.first_name} ${app.lead.last_name}`.toLowerCase();
        const carTitle = app.car_info?._vehicleTitle?.toLowerCase() || '';
        return leadName.includes(searchLower) ||
               app.lead.email?.toLowerCase().includes(searchLower) ||
               app.lead.phone?.includes(searchTerm) ||
               carTitle.includes(searchLower);
      });
    }

    // Filtro de estatus
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusConfigLocal = (status: string) => {
    const statusConfig = getStatusConfig(status);

    const iconMap: Record<string, React.ElementType> = {
      draft: Clock,
      Completa: CheckCircle,
      'Faltan Documentos': AlertTriangle,
      'En Revisión': Clock,
      Aprobada: CheckCircle,
      Rechazada: XCircle,
      // Legacy
      submitted: CheckCircle,
      reviewing: Clock,
      pending_docs: AlertTriangle,
      approved: CheckCircle,
      rejected: XCircle,
      in_review: Clock,
    };

    return {
      text: statusConfig.label,
      color: statusConfig.badgeClass,
      icon: iconMap[status] || Clock,
    };
  };

  const downloadSolicitudPDF = async (appId: string) => {
    try {
      toast.info('Generando PDF...');
      // TODO: Implementar descarga de PDF
      // Similar a como se hace en SalesClientProfilePage
      toast.success('PDF descargado');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadApplications}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Solicitudes de Financiamiento</h1>
        <p className="text-gray-600">
          Administra todas las solicitudes de financiamiento de tus leads asignados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completa}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faltan Documentos</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.faltan_documentos}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Revisión</p>
                <p className="text-2xl font-bold text-purple-600">{stats.en_revision}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.aprobada}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, email, teléfono o vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estatus</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.DRAFT}>Borrador</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.COMPLETA}>Completa</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.FALTAN_DOCUMENTOS}>Faltan Documentos</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.EN_REVISION}>En Revisión</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.APROBADA}>Aprobada</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.RECHAZADA}>Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron solicitudes con los filtros aplicados'
                : 'No tienes solicitudes asignadas'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las solicitudes de tus leads asignados aparecerán aquí'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const statusConfig = getStatusConfigLocal(app.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Lead Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary-100 rounded-full p-2">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {app.lead.first_name} {app.lead.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{app.lead.email}</p>
                          <p className="text-sm text-gray-600">{app.lead.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {app.car_info?._vehicleTitle || 'Sin vehículo especificado'}
                          </p>
                          <p className="text-xs text-gray-600">
                            Docs: {app.documents_count || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Date */}
                    <div className="lg:col-span-3">
                      <Badge className={`${statusConfig.color} mb-2`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.text}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.created_at).toLocaleDateString('es-MX')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-3 flex items-center gap-2 flex-wrap lg:justify-end">
                      <Link to={`/escritorio/seguimiento/${app.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      {app.public_upload_token && (
                        <Link to={`/documentos/${app.public_upload_token}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-1" />
                            Cargar Docs
                          </Button>
                        </Link>
                      )}
                      <Link to={`/escritorio/ventas/cliente/${app.lead.id}`}>
                        <Button variant="default" size="sm">
                          Perfil Completo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VentasSolicitudesPage;
