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
  Upload
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
  'proof_income' // Puede ser 3 estados de cuenta o 1 zip
];

const DashboardSidebarPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState({
    borradores: 0,
    enviadas: 0,
    documentosPendientes: 0,
    status: 'draft' as 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending',
    progreso: 0
  });
  const [publicUploadLink, setPublicUploadLink] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [latestApplication, setLatestApplication] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener todas las solicitudes del usuario
      const { data: applications } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const latestApp = applications?.[0];
      setLatestApplication(latestApp);

      // Contar borradores y enviadas
      const borradores = applications?.filter(app => app.status === 'draft').length || 0;
      const enviadas = applications?.filter(app =>
        app.status === 'submitted' || app.status === 'approved' || app.status === 'pending'
      ).length || 0;

      // Obtener documentos de la solicitud más reciente
      let documentosPendientes = 4; // Por defecto todos pendientes
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

        // proof_income puede ser múltiples archivos o un zip
        const proofIncomeCount = uploadedDocs.filter(doc =>
          doc.document_type === 'proof_income'
        ).length;
        if (proofIncomeCount >= 1) docsPresentes++; // Al menos 1 documento de ingresos

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

        // Generar link público si existe public_upload_token
        if (latestApp.public_upload_token) {
          const baseUrl = window.location.origin;
          setPublicUploadLink(`${baseUrl}/upload-documentos/${latestApp.public_upload_token}`);
        }
      }

      // Calcular progreso: 100% solo si hay solicitud enviada Y 0 docs pendientes
      let progress = 0;
      const hasSubmittedApp = applications?.some(app =>
        app.status === 'submitted' || app.status === 'approved' || app.status === 'pending'
      );

      if (hasSubmittedApp && documentosPendientes === 0) {
        progress = 100;
      } else {
        // Progreso parcial
        if (applications && applications.length > 0) progress += 50;
        if (documentosPendientes < 4) {
          progress += (4 - documentosPendientes) * 12.5; // 12.5% por cada doc
        }
      }

      setStats({
        borradores,
        enviadas,
        documentosPendientes,
        status: latestApp?.status || 'draft',
        progreso: Math.min(progress, 100)
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

  const statusConfig = getStatusConfig(stats.status);
  const docsComplete = stats.documentosPendientes === 0;

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
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Borradores */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Borradores</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.borradores}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Enviadas */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Enviadas</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.enviadas}</p>
                  </div>
                </CardContent>
              </Card>

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

            {/* Progress Bar */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Progreso del Proceso
                </h3>
                <div className="space-y-2">
                  <Progress value={stats.progreso} className="h-3" />
                  <p className="text-sm text-gray-600">
                    {stats.progreso === 100
                      ? '¡Proceso completado! Todos los documentos han sido enviados.'
                      : `Has completado el ${stats.progreso}% del proceso`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/escritorio/profile">
                <Card className="border-2 hover:border-primary-500 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="font-semibold text-gray-800">Mi Perfil</p>
                        <p className="text-sm text-gray-600">Actualiza tu información</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/escritorio/perfilacion-bancaria">
                <Card className="border-2 hover:border-primary-500 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="font-semibold text-gray-800">Perfilación Bancaria</p>
                        <p className="text-sm text-gray-600">Completa tu perfil</p>
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
                  <div className="flex items-start gap-6">
                    {/* QR Code */}
                    <div className="flex-shrink-0">
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
                    <div className="flex-1">
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
