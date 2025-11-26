import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Phone,
  MessageCircle,
  Heart,
  TrendingUp
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

const SALES_AGENTS = [
  { id: 'd21e808e-083c-48fd-be78-d52ee7837146', name: 'Anahi Garza Garcia', phone: '+52 81 8704 9079' },
  { id: 'cb55da28-ef7f-4632-9fcd-a8d9f37f1463', name: 'Carlos Isidro Berrones', phone: '+52 81 8704 9079' },
  { id: 'e49bf74c-308f-4e8d-b683-3575d7214e98', name: 'Daniel Rodríguez', phone: '+52 81 8704 9079' },
  { id: '7e239ec5-aceb-4e9f-ae67-2ac16733609b', name: 'David Rojas', phone: '+52 81 8704 9079' },
  { id: 'fe901e9e-c3f2-41a1-b5a0-6d95c9d81344', name: 'David Marconi Mazariegos', phone: '+52 81 8704 9079' },
  { id: 'a4165ce3-e52b-4f8d-9123-327c0179f73c', name: 'Israel Ramírez', phone: '+52 81 8704 9079' },
  { id: '4c8c43bb-c936-44a2-ab82-f40326387770', name: 'Ramón Araujo', phone: '+52 81 8704 9079' },
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
  const [assignedAgent, setAssignedAgent] = useState<any>(null);
  const [sidebarVehicles, setSidebarVehicles] = useState<any[]>([]);
  const [vehiclesLabel, setVehiclesLabel] = useState('');
  const location = useLocation();

  const loadStats = useCallback(async () => {
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
          setPublicUploadLink(`${baseUrl}/documentos/${latestApp.public_upload_token}`);
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

      // Cargar asesor asignado
      console.log('Profile asesor_asignado_id:', profile?.asesor_asignado_id);
      if (profile?.asesor_asignado_id) {
        const agent = SALES_AGENTS.find(a => a.id === profile.asesor_asignado_id);
        console.log('Found agent:', agent);
        if (agent) {
          setAssignedAgent(agent);
        }
      }

      // Cargar vehículos para sidebar: favoritos > recently viewed > sugerencias
      let vehiclesLoaded = false;

      try {
        // 1. Intentar cargar favoritos
        const { data: favorites, error: favError } = await supabase
          .from('user_favorites')
          .select('vehicle_id')
          .eq('user_id', user.id)
          .limit(3);

        console.log('Favorites query result:', favorites, favError);

        if (favorites && favorites.length > 0) {
          const vehicleIds = favorites.map(f => f.vehicle_id);
          const { data: favVehicles, error: vehError } = await supabase
            .from('vehicles')
            .select('id, slug, titulo, precio, feature_image, fotos_exterior_url, galeria_exterior')
            .in('id', vehicleIds)
            .limit(3);

          console.log('Favorite vehicles:', favVehicles, vehError);

          if (favVehicles && favVehicles.length > 0) {
            setSidebarVehicles(favVehicles);
            setVehiclesLabel('Tus Favoritos');
            vehiclesLoaded = true;
          }
        }

        // 2. Si no hay favoritos, intentar recently viewed
        if (!vehiclesLoaded) {
          const recentlyViewedRaw = localStorage.getItem('trefa_recently_viewed');
          console.log('Recently viewed raw:', recentlyViewedRaw);

          if (recentlyViewedRaw) {
            const recentlyViewed = JSON.parse(recentlyViewedRaw);
            if (recentlyViewed && recentlyViewed.length > 0) {
              setSidebarVehicles(recentlyViewed.slice(0, 3));
              setVehiclesLabel('Vistos Recientemente');
              vehiclesLoaded = true;
            }
          }
        }

        // 3. Si no hay ni favoritos ni recently viewed, mostrar sugerencias
        if (!vehiclesLoaded) {
          const { data: suggestions, error: sugError } = await supabase
            .from('vehicles')
            .select('id, slug, titulo, precio, feature_image, fotos_exterior_url, galeria_exterior')
            .eq('disponibilidad', 'disponible')
            .order('created_at', { ascending: false })
            .limit(3);

          console.log('Suggestions:', suggestions, sugError);

          if (suggestions && suggestions.length > 0) {
            setSidebarVehicles(suggestions);
            setVehiclesLabel('Algunas Sugerencias');
          }
        }
      } catch (error) {
        console.error('Error cargando vehículos para sidebar:', error);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []); // Empty deps - function doesn't depend on any external values

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
          isOpen ? 'w-56' : 'w-16'
        } bg-background border-r transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="px-3 py-3 border-b flex items-center justify-center">
          {isOpen ? (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        {isOpen && (
          <div className="flex-1 px-3 py-2 overflow-y-auto space-y-2">
            {/* Assigned Agent */}
            {assignedAgent && (
              <div className="bg-accent/50 p-2 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                    {assignedAgent.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {assignedAgent.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Tu Asesor</p>
                  </div>
                </div>
                <a
                  href={`tel:${assignedAgent.phone}`}
                  className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 bg-background border rounded-md hover:bg-accent transition-colors text-xs font-medium"
                >
                  <Phone className="w-3 h-3" />
                  <span className="truncate">{assignedAgent.phone}</span>
                </a>
              </div>
            )}

            {/* WhatsApp Support */}
            <a
              href="https://wa.me/5218187049079?text=Hola,%20necesito%20ayuda%20con%20mi%20financiamiento"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full px-2 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Soporte WhatsApp
            </a>

            {/* Vehicles Section */}
            {sidebarVehicles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {vehiclesLabel === 'Tus Favoritos' && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
                  {vehiclesLabel === 'Vistos Recientemente' && <TrendingUp className="w-3 h-3 text-blue-500" />}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {vehiclesLabel}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {sidebarVehicles.map((vehicle) => {
                    const imageUrl = vehicle.feature_image || vehicle.fotos_exterior_url?.[0] || vehicle.galeria_exterior?.[0];
                    return (
                      <div key={vehicle.id} className="bg-accent/50 rounded-md p-1.5 border">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={vehicle.titulo}
                              className="w-12 h-9 object-cover rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 bg-muted rounded flex items-center justify-center flex-shrink-0">
                              <Car className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold truncate">
                              {vehicle.titulo}
                            </p>
                            <p className="text-[10px] text-primary font-bold">
                              ${vehicle.precio?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/autos/${vehicle.slug || vehicle.id}`}
                          className="block w-full px-2 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded hover:bg-primary/90 transition-colors text-center"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed State */}
        {!isOpen && (
          <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-3">
            {assignedAgent && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                {assignedAgent.name.charAt(0)}
              </div>
            )}
            <MessageCircle className="w-5 h-5 text-green-500" />
            {vehiclesLabel === 'Tus Favoritos' && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              Panel de Control
            </h1>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary" />
              <Link to="/escritorio/profile">
                <User className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4">
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
