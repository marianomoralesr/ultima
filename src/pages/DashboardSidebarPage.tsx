import React, { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  Package,
  FileText,
  Bell,
  CreditCard,
  User,
  Menu,
  X,
  CheckCircle,
  Copy,
  Car,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '../../supabaseClient';
import Logo from '@/assets/svg/logo';
import { toast } from 'sonner';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'Escritorio',
    href: '/escritorio',
    icon: <Home className="w-6 h-6" />
  },
  {
    label: 'Progreso',
    href: '/escritorio/seguimiento',
    icon: <MapPin className="w-6 h-6" />
  },
  {
    label: 'Inventario',
    href: '/autos',
    icon: <Package className="w-6 h-6" />
  },
  {
    label: 'Mis Solicitudes',
    href: '/escritorio/seguimiento',
    icon: <FileText className="w-6 h-6" />
  },
  {
    label: 'Notificaciones',
    href: '/escritorio',
    icon: <Bell className="w-6 h-6" />
  },
  {
    label: 'Documentos',
    href: '/escritorio',
    icon: <FileText className="w-6 h-6" />
  },
  {
    label: 'Mi Cuenta',
    href: '/escritorio/profile',
    icon: <User className="w-6 h-6" />
  }
];

// Documentos obligatorios
const REQUIRED_DOCUMENTS = [
  'ine_front',
  'ine_back',
  'proof_address',
  'proof_income'
];

// Mensajes motivacionales basados en progreso
const getMotivationalMessage = (progress: number): string => {
  if (progress === 0) return '¡Comienza tu proceso de financiamiento hoy!';
  if (progress < 25) return '¡Buen comienzo! Sigue completando tu información.';
  if (progress < 50) return '¡Vas muy bien! Estás a mitad de camino.';
  if (progress < 75) return '¡Excelente progreso! Ya casi terminas.';
  if (progress < 100) return '¡Casi lo logras! Solo un paso más.';
  return '¡Felicidades! Has completado todo el proceso.';
};

const DashboardSidebarPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState({
    borradores: 0,
    enviadas: 0,
    documentosPendientes: 0,
    status: 'draft' as 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending',
    progreso: 0,
    profileComplete: false,
    bankProfileComplete: false
  });
  const [publicUploadLink, setPublicUploadLink] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [latestApplication, setLatestApplication] = useState<any>(null);
  const [draftApplications, setDraftApplications] = useState<any[]>([]);
  const [submittedApplications, setSubmittedApplications] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar perfil completo
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profileComplete = !!(
        profile?.first_name &&
        profile?.last_name &&
        profile?.phone &&
        profile?.email
      );

      // Verificar perfilación bancaria completa
      const { data: bankProfile } = await supabase
        .from('bank_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const bankProfileComplete = bankProfile?.is_complete || false;

      // Obtener todas las solicitudes del usuario
      const { data: applications } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const latestApp = applications?.[0];
      setLatestApplication(latestApp);

      // Separar borradores y enviadas
      const drafts = applications?.filter(app => app.status === 'draft') || [];
      const submitted = applications?.filter(app =>
        app.status === 'submitted' || app.status === 'approved' || app.status === 'pending'
      ) || [];

      setDraftApplications(drafts);
      setSubmittedApplications(submitted);

      const borradores = drafts.length;
      const enviadas = submitted.length;

      // Validar límite de 1 solicitud enviada
      if (enviadas > 1) {
        console.warn('⚠️ Usuario tiene más de 1 solicitud enviada');
      }

      // Obtener documentos de la solicitud más reciente
      let documentosPendientes = 4;
      let uploadedDocs: any[] = [];

      if (latestApp) {
        const { data: documents } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('application_id', latestApp.id);

        uploadedDocs = documents || [];

        // Contar documentos obligatorios presentes
        const docTypes = new Set(uploadedDocs.map(doc => doc.document_type));

        let docsPresentes = 0;
        if (docTypes.has('ine_front')) docsPresentes++;
        if (docTypes.has('ine_back')) docsPresentes++;
        if (docTypes.has('proof_address')) docsPresentes++;

        const proofIncomeCount = uploadedDocs.filter(doc =>
          doc.document_type === 'proof_income'
        ).length;
        if (proofIncomeCount >= 1) docsPresentes++;

        documentosPendientes = 4 - docsPresentes;

        // Obtener vehículo seleccionado
        if (latestApp.car_info?.id) {
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', latestApp.car_info.id)
            .single();

          setSelectedVehicle(vehicle);
        }

        // Generar link público
        if (latestApp.public_upload_token) {
          const baseUrl = window.location.origin;
          setPublicUploadLink(`${baseUrl}/upload-documentos/${latestApp.public_upload_token}`);
        }
      }

      // Calcular progreso
      let progress = 0;
      const hasSubmittedApp = enviadas > 0;

      if (hasSubmittedApp && documentosPendientes === 0) {
        progress = 100;
      } else {
        if (profileComplete) progress += 20;
        if (bankProfileComplete) progress += 20;
        if (applications && applications.length > 0) progress += 30;
        if (documentosPendientes < 4) {
          progress += (4 - documentosPendientes) * 7.5;
        }
      }

      setStats({
        borradores,
        enviadas,
        documentosPendientes,
        status: latestApp?.status || 'draft',
        progreso: Math.min(progress, 100),
        profileComplete,
        bankProfileComplete
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Borrador',
          bgColor: 'bg-gray-500',
          textColor: 'text-white'
        };
      case 'submitted':
      case 'pending':
        return {
          label: 'En Revisión',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      case 'approved':
        return {
          label: 'Aprobada',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'rejected':
        return {
          label: 'Rechazada',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      default:
        return {
          label: 'Sin Solicitud',
          bgColor: 'bg-gray-400',
          textColor: 'text-white'
        };
    }
  };

  const copyToClipboard = () => {
    if (publicUploadLink) {
      navigator.clipboard.writeText(publicUploadLink);
      toast.success('Link copiado al portapapeles');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusConfig = getStatusConfig(stats.status);
  const docsComplete = stats.documentosPendientes === 0;
  const motivationalMessage = getMotivationalMessage(stats.progreso);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {isOpen ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                <Logo className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-800">TREFA</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="p-1 hover:bg-gray-100 rounded-md mx-auto"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${!isOpen && 'justify-center'}`}
                    title={!isOpen ? item.label : undefined}
                  >
                    <span className={isActive ? 'text-primary-600' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Panel de Control
            </h1>
            <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-primary-600" />
              <Link to="/escritorio/profile">
                <User className="w-6 h-6 text-gray-600 cursor-pointer hover:text-primary-600" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Limit Warning */}
            {stats.enviadas > 1 && (
              <Card className="border-2 border-yellow-500 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-800">
                        Aviso: Solo se permite 1 solicitud enviada a la vez
                      </p>
                      <p className="text-sm text-yellow-700">
                        Actualmente tienes {stats.enviadas} solicitudes enviadas. Por favor, contacta a soporte.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Borradores - Clickable */}
              <div
                className="cursor-pointer"
                onClick={() => setShowDrafts(!showDrafts)}
              >
                <Card className="border-2 hover:border-gray-400 transition-colors">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Borradores</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.borradores}</p>
                      {stats.borradores > 0 && (
                        <div className="mt-2">
                          {showDrafts ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enviadas - Clickable */}
              <div
                className="cursor-pointer"
                onClick={() => setShowSubmitted(!showSubmitted)}
              >
                <Card className="border-2 hover:border-blue-400 transition-colors">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Enviadas</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.enviadas}</p>
                      {stats.enviadas > 0 && (
                        <div className="mt-2">
                          {showSubmitted ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Docs Pendientes */}
              <Card className={`border-2 ${docsComplete ? 'border-green-500 bg-green-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="text-center">
                    {docsComplete ? (
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    ) : (
                      <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-gray-600">Docs. Pendientes</p>
                    <p className={`text-3xl font-bold ${docsComplete ? 'text-green-600' : 'text-gray-800'}`}>
                      {stats.documentosPendientes}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Estado de Solicitud */}
              <Card className={`border-2 ${statusConfig.bgColor}`}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <MapPin className={`w-8 h-8 ${statusConfig.textColor} mx-auto mb-2`} />
                    <p className={`text-sm ${statusConfig.textColor} opacity-90`}>Estado</p>
                    <p className={`text-xl font-bold ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dropdown Lists */}
            {showDrafts && draftApplications.length > 0 && (
              <Card className="border-2 border-gray-300">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Borradores</h3>
                  <div className="space-y-2">
                    {draftApplications.map((app) => (
                      <Link
                        key={app.id}
                        to={`/escritorio/aplicacion/${app.id}`}
                        className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">
                              {app.car_info?.title || 'Solicitud sin vehículo'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Creada: {formatDate(app.created_at)}
                            </p>
                          </div>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Borrador
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {showSubmitted && submittedApplications.length > 0 && (
              <Card className="border-2 border-blue-300">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Solicitudes Enviadas</h3>
                  <div className="space-y-2">
                    {submittedApplications.map((app) => (
                      <Link
                        key={app.id}
                        to={`/escritorio/seguimiento/${app.id}`}
                        className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">
                              {app.car_info?.title || 'Solicitud sin vehículo'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Enviada: {formatDate(app.created_at)}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            app.status === 'approved' ? 'bg-green-200 text-green-800' :
                            app.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {getStatusConfig(app.status).label}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar with Motivational Message */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Progreso del Proceso
                    </h3>
                    <p className="text-sm font-medium text-primary-600">
                      {motivationalMessage}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-800">{stats.progreso}%</span>
                  </div>
                </div>
                <Progress value={stats.progreso} className="h-3" />
              </CardContent>
            </Card>

            {/* Action Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mi Perfil con check sutil */}
              <Link to="/escritorio/profile">
                <Card className={`border-2 hover:border-primary-500 transition-colors cursor-pointer h-full ${
                  stats.profileComplete ? 'border-green-300 bg-green-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      {stats.profileComplete ? (
                        <div className="relative">
                          <User className="w-8 h-8 text-primary-600" />
                          <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                        </div>
                      ) : (
                        <User className="w-8 h-8 text-primary-600" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">Mi Perfil</p>
                        <p className="text-sm text-gray-600">
                          {stats.profileComplete ? 'Completado ✓' : 'Actualiza tu información'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Perfilación Bancaria con check sutil */}
              <Link to="/escritorio/perfilacion-bancaria">
                <Card className={`border-2 hover:border-primary-500 transition-colors cursor-pointer h-full ${
                  stats.bankProfileComplete ? 'border-green-300 bg-green-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      {stats.bankProfileComplete ? (
                        <div className="relative">
                          <CreditCard className="w-8 h-8 text-primary-600" />
                          <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                        </div>
                      ) : (
                        <CreditCard className="w-8 h-8 text-primary-600" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">Perfilación Bancaria</p>
                        <p className="text-sm text-gray-600">
                          {stats.bankProfileComplete ? 'Completado ✓' : 'Completa tu perfil'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Vehículo Seleccionado */}
              {selectedVehicle ? (
                <Link to={`/autos/${selectedVehicle.slug || selectedVehicle.id}`}>
                  <Card className="border-2 hover:border-primary-500 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {selectedVehicle.images?.[0] ? (
                          <img
                            src={selectedVehicle.images[0]}
                            alt={selectedVehicle.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <Car className="w-16 h-16 text-primary-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {selectedVehicle.title || 'Vehículo'}
                          </p>
                          <p className="text-xs text-gray-500">ID: {selectedVehicle.id}</p>
                          <p className="text-sm text-gray-600">Ver detalles</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Link to="/autos">
                  <Card className="border-2 border-dashed hover:border-primary-500 transition-colors cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Car className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-600">Sin vehículo</p>
                          <p className="text-sm text-gray-500">Selecciona uno</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Dropzone Section with QR and Link */}
            {publicUploadLink && latestApplication && (
              <Card className="border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* QR Code */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <QRCodeSVG
                          value={publicUploadLink}
                          size={120}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600 mt-2">
                        Escanea para subir
                      </p>
                    </div>

                    {/* Dropzone Info */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <Upload className="w-8 h-8 text-primary-600" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            Zona de Carga de Documentos
                          </h3>
                          <p className="text-sm text-gray-600">
                            Comparte este link o QR para recibir documentos
                          </p>
                        </div>
                      </div>

                      {/* Link con botón copiar */}
                      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border-2 border-gray-200">
                        <input
                          type="text"
                          value={publicUploadLink}
                          readOnly
                          className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          <Copy className="w-4 h-4" />
                          Copiar
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        {docsComplete
                          ? '✓ Todos los documentos han sido recibidos'
                          : `Faltan ${stats.documentosPendientes} documento(s) por recibir`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardSidebarPage;
