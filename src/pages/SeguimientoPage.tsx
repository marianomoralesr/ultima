import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Loader2, AlertTriangle, FileText, Download, Trash2, Eye, ShieldAlert, CheckCircle, ArrowLeft, Edit, X, Car } from 'lucide-react';
import { ApplicationService } from '../services/ApplicationService';
import { useAuth } from '../context/AuthContext';
import PrintableApplication from '../components/PrintableApplication';
import { UserDataService } from '../services/UserDataService';
import { PrintIcon, WhatsAppIcon } from '../components/icons';
import { APPLICATION_STATUS, getStatusConfig, type ApplicationStatus } from '../constants/applicationStatus';
import { Card, CardContent } from '@/components/ui/card';

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  car_info: any;
  personal_info_snapshot: any;
  selected_banks: string[];
  application_data: any;
}

const statusMap: Record<string, { text: string; icon: any; color: string; bgColor: string }> = {
    [APPLICATION_STATUS.DRAFT]: { text: "Borrador", icon: FileText, color: "text-gray-500", bgColor: "bg-gray-100" },
    [APPLICATION_STATUS.COMPLETA]: { text: "Completa", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: { text: "Faltan Documentos", icon: FileText, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    [APPLICATION_STATUS.EN_REVISION]: { text: "En Revisión", icon: Clock, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    [APPLICATION_STATUS.APROBADA]: { text: "Aprobada", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    [APPLICATION_STATUS.RECHAZADA]: { text: "Rechazada", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
    // Legacy status mappings for backward compatibility
    [APPLICATION_STATUS.SUBMITTED]: { text: "Enviada", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
    [APPLICATION_STATUS.REVIEWING]: { text: "En Revisión", icon: Clock, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    [APPLICATION_STATUS.PENDING_DOCS]: { text: "Documentos Pendientes", icon: FileText, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    [APPLICATION_STATUS.APPROVED]: { text: "Aprobada", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    'rejected': { text: "Rechazada", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
};

const ApplicationDetailView: React.FC<{ application: ApplicationData }> = ({ application }) => {
    const { text, icon: Icon, color, bgColor } = statusMap[application.status] || statusMap.draft;
    const profile = application.personal_info_snapshot || {};
    const carInfo = application.car_info || {};

    const getStatusDescription = () => {
        switch(application.status) {
            case APPLICATION_STATUS.COMPLETA:
            case APPLICATION_STATUS.SUBMITTED:
            case APPLICATION_STATUS.EN_REVISION:
            case APPLICATION_STATUS.REVIEWING:
            case APPLICATION_STATUS.IN_REVIEW:
                return `¡Felicidades, ${profile.first_name}! Hemos recibido tu solicitud y nuestro equipo ya la está revisando. Normalmente, recibirás una respuesta en las próximas 24 horas hábiles.`;
            case APPLICATION_STATUS.FALTAN_DOCUMENTOS:
            case APPLICATION_STATUS.PENDING_DOCS:
                return 'Hemos revisado tu solicitud, pero necesitamos que subas algunos documentos para continuar. Por favor, ve a tu dashboard para completar este paso.';
            case APPLICATION_STATUS.APROBADA:
            case APPLICATION_STATUS.APPROVED:
                return '¡Excelentes noticias! Tu solicitud de financiamiento ha sido aprobada. Un asesor se pondrá en contacto contigo para coordinar los siguientes pasos.';
            case APPLICATION_STATUS.RECHAZADA:
            case 'rejected':
                return 'Después de una revisión cuidadosa, no pudimos aprobar tu solicitud en este momento. Te invitamos a contactar a un asesor para explorar otras opciones.';
            case APPLICATION_STATUS.DRAFT:
            default:
                return 'Este es un borrador de tu solicitud. Puedes continuar editándola cuando quieras.';
        }
    };

    return (
        <>
            {/* --- ON-SCREEN VIEW --- */}
            <div className="space-y-8 no-print">
                {/* Status Header */}
                <div className={`p-6 rounded-xl text-center ${bgColor}`}>
                    <Icon className={`w-16 h-16 ${color} mx-auto mb-4`} />
                    <h2 className={`text-2xl font-bold ${color}`}>{text}</h2>
                    <p className="text-gray-500 mt-1">Solicitud #{application.id.substring(0, 8)}...</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Next Steps / Summary */}
                        <div className="p-6 bg-white rounded-xl shadow-sm border">
                            <h3 className="font-bold text-gray-800">Resumen y Próximos Pasos</h3>
                            <p className="text-sm text-gray-600 mt-2">{getStatusDescription()}</p>
                        </div>

                        {/* Vehicle Info */}
                        {carInfo._vehicleTitle && (
                            <div className="p-6 bg-white rounded-xl shadow-sm border">
                                <h3 className="font-bold text-gray-800 mb-4">Vehículo en tu Solicitud</h3>
                                <div className="flex items-center gap-4">
                                    <img src={carInfo._featureImage} alt={carInfo._vehicleTitle} className="w-24 h-20 object-cover rounded-md flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{carInfo._vehicleTitle}</h4>
                                        <p className="text-sm text-gray-500">Orden de Compra: {carInfo._ordenCompra}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 lg:sticky lg:top-24">
                        <div className="p-6 bg-white rounded-xl shadow-sm border">
                            <h3 className="font-bold text-gray-800 mb-4">Acciones</h3>
                            <div className="space-y-3">
                                <a href={`https://wa.me/5218187049079?text=Hola,%20quisiera%20dar%20seguimiento%20a%20mi%20solicitud%20${application.id.substring(0,8)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold text-sm rounded-lg hover:bg-green-600 transition-colors">
                                    <WhatsAppIcon className="w-5 h-5" /> Contactar Asesor
                                </a>
                                <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white font-semibold text-sm rounded-lg hover:bg-gray-700 transition-colors">
                                    <PrintIcon className="w-5 h-5" /> Imprimir / Guardar PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --- PRINT-ONLY VIEW --- */}
            <div className="print-only">
                <PrintableApplication application={application} />
            </div>
        </>
    );
};


const SeguimientoPage: React.FC = () => {
  const { id: applicationIdFromUrl } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [actionError, setActionError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPrintableModal, setShowPrintableModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    ApplicationService.getUserApplications(user.id)
        .then(data => {
            console.log("Supabase applications data:", data);
            setApplications(data as ApplicationData[]);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
  }, [user]);

  const handleDownloadData = async () => {
    if (!user) return;
    setActionStatus('loading');
    setActionError('');
    try {
        await UserDataService.downloadUserData(user.id);
        setActionStatus('success');
    } catch(e: any) {
        setActionStatus('idle');
        setActionError(e.message || 'Error al descargar los datos.');
    }
    setTimeout(() => setActionStatus('idle'), 3000);
  };

  const handleDeleteData = async () => {
    if (!user) return;
    setActionStatus('loading');
    setActionError('');
    try {
        await UserDataService.deleteSensitiveData(user.id);
        setActionStatus('success');
        setIsModalOpen(false);
    } catch(e: any) {
        setActionStatus('idle');
        setActionError(e.message || 'Error al eliminar los datos.');
    }
     setTimeout(() => setActionStatus('idle'), 3000);
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error}</div>;

  const currentApplication = applicationIdFromUrl ? applications.find(a => a.id === applicationIdFromUrl) : null;

  return (
      <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
          {applicationIdFromUrl ? (
              <div>
                  <Link to="/escritorio/seguimiento" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-semibold no-print">
                      <ArrowLeft className="w-4 h-4" />
                      Volver a Mis Solicitudes
                  </Link>
                  <div className="mt-6">
                      {currentApplication ? <ApplicationDetailView application={currentApplication} /> : <p>Solicitud no encontrada.</p>}
                  </div>
              </div>
          ) : (
              <>
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes y Datos</h1>
                      <p className="mt-1 text-gray-600">Revisa tus solicitudes pasadas y gestiona tu información personal.</p>
                  </div>

                  {/* Separate applications into drafts and submitted */}
                  {(() => {
                    const drafts = applications.filter(app => app.status === APPLICATION_STATUS.DRAFT);
                    const submitted = applications.filter(app =>
                      app.status !== APPLICATION_STATUS.DRAFT
                    );

                    const formatDate = (dateString: string) => {
                      return new Date(dateString).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                    };

                    return (
                      <>
                        {/* Borradores Section */}
                        {drafts.length > 0 && (
                          <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Borradores</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {drafts.map(app => {
                                const status = statusMap[app.status] || statusMap.draft;
                                return (
                                  <Link
                                    key={app.id}
                                    to={`/escritorio/aplicacion/${app.id}`}
                                    className="block"
                                  >
                                    <Card className="border-2 hover:border-gray-400 transition-all hover:shadow-md cursor-pointer h-full">
                                      <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                          {app.car_info?._featureImage ? (
                                            <img
                                              src={app.car_info._featureImage}
                                              alt={app.car_info._vehicleTitle || 'Vehículo'}
                                              className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                          ) : (
                                            <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                              <Car className="w-8 h-8 text-gray-400" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                              {app.car_info?._vehicleTitle || 'Solicitud General'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Creada: {formatDate(app.created_at)}
                                            </p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1.5 ${status.bgColor} ${status.color}`}>
                                              <status.icon className="w-3 h-3" />
                                              {status.text}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                            <Edit className="w-3 h-3" />
                                            Haz clic para continuar editando
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Solicitudes Enviadas Section */}
                        {submitted.length > 0 && (
                          <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitudes Enviadas</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {submitted.map(app => {
                                const status = statusMap[app.status] || statusMap.draft;
                                return (
                                  <Link
                                    key={app.id}
                                    to={`/escritorio/seguimiento/${app.id}`}
                                    className="block"
                                  >
                                    <Card className="border-2 hover:border-blue-400 transition-all hover:shadow-md cursor-pointer h-full">
                                      <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                          {app.car_info?._featureImage ? (
                                            <img
                                              src={app.car_info._featureImage}
                                              alt={app.car_info._vehicleTitle || 'Vehículo'}
                                              className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                          ) : (
                                            <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                              <Car className="w-8 h-8 text-gray-400" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                              {app.car_info?._vehicleTitle || 'Solicitud General'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Enviada: {formatDate(app.created_at)}
                                            </p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1.5 ${status.bgColor} ${status.color}`}>
                                              <status.icon className="w-3 h-3" />
                                              {status.text}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                            <Eye className="w-3 h-3" />
                                            Haz clic para ver detalles
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {applications.length === 0 && (
                          <Card className="border-2 border-dashed">
                            <CardContent className="p-12 text-center">
                              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-lg font-semibold text-gray-600 mb-2">
                                Aún no has creado ninguna solicitud
                              </p>
                              <p className="text-sm text-gray-500 mb-6">
                                Comienza tu proceso de financiamiento seleccionando un vehículo
                              </p>
                              <Link
                                to="/autos"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                              >
                                <Car className="w-5 h-5" />
                                Ver Inventario
                              </Link>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    );
                  })()}

                  <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h2 className="text-lg font-semibold text-gray-800 mb-4">Gestión de Datos Personales</h2>
                      <p className="text-sm text-gray-600 mb-6">En cumplimiento con la Ley Federal de Protección de Datos, tienes control total sobre tu información.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-lg border">
                              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Download className="w-5 h-5"/>Descargar mis datos</h3>
                              <p className="text-xs text-gray-500 mt-1 mb-3">Obtén una copia de toda tu información de perfil y solicitudes en formato JSON.</p>
                              <button onClick={handleDownloadData} disabled={actionStatus==='loading'} className="w-full text-sm font-semibold py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                                  {actionStatus === 'loading' ? 'Preparando...' : 'Descargar Información'}
                              </button>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                              <h3 className="font-semibold text-red-800 flex items-center gap-2"><Trash2 className="w-5 h-5"/>Eliminar datos sensibles</h3>
                              <p className="text-xs text-red-700 mt-1 mb-3">Elimina permanentemente tus documentos e información personal identificable.</p>
                              <button onClick={() => setIsModalOpen(true)} className="w-full text-sm font-semibold py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700">
                                  Eliminar Datos
                              </button>
                          </div>
                      </div>
                      {actionStatus === 'success' && <p className="mt-4 text-center text-sm text-green-600 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/>¡Acción completada con éxito!</p>}
                      {actionError && <p className="mt-4 text-center text-sm text-red-600">{actionError}</p>}
                  </div>

                  {isModalOpen && (
                      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 text-center">
                              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                              <h2 className="text-xl font-bold text-gray-900">¿Estás seguro?</h2>
                              <p className="text-gray-600 mt-2 text-sm">Esta acción es irreversible. Se eliminarán todos tus documentos (INE, comprobantes) y datos personales sensibles (dirección, RFC, etc.) de nuestros registros.</p>
                              <p className="text-gray-600 mt-2 text-sm"><strong>Tu cuenta no será eliminada,</strong> pero si deseas aplicar a un financiamiento en el futuro, deberás volver a proporcionar toda tu información.</p>
                              <div className="mt-6 flex justify-center gap-4">
                                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancelar</button>
                                  <button onClick={handleDeleteData} disabled={actionStatus==='loading'} className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60">
                                      {actionStatus==='loading' ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Sí, eliminar mis datos'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* PrintableApplication Modal */}
                  {showPrintableModal && selectedApplication && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPrintableModal(false)}>
                          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                              <button
                                  onClick={() => setShowPrintableModal(false)}
                                  className="sticky top-4 right-4 float-right z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                              >
                                  <X className="w-5 h-5 text-gray-600" />
                              </button>
                              <div className="p-6">
                                  <PrintableApplication application={selectedApplication} />
                              </div>
                          </div>
                      </div>
                  )}
              </>
          )}
      </div>
    </div>
  );
};

export default SeguimientoPage;