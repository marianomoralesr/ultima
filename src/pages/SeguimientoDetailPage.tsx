import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, FileText, Download, Eye, X, Car, Copy, Check, QrCode, ArrowLeft, CheckCircle } from 'lucide-react';
import { ApplicationService } from '../services/ApplicationService';
import { useAuth } from '../context/AuthContext';
import PrintableApplication from '../components/PrintableApplication';
import { APPLICATION_STATUS, type ApplicationStatus } from '../constants/applicationStatus';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  car_info: any;
  personal_info_snapshot: any;
  selected_banks: string[];
  application_data: any;
  public_upload_token: string | null;
}

const SeguimientoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintable, setShowPrintable] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [uploadLinkVisible, setUploadLinkVisible] = useState(false);

  useEffect(() => {
    const loadApplication = async () => {
      // Validate id is a valid UUID (not "undefined" or "null" strings)
      if (!user || !id || id === 'undefined' || id === 'null') {
        if (id === 'undefined' || id === 'null') {
          setError('ID de solicitud inválido');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const app = await ApplicationService.getApplicationById(user.id, id);

        if (app.user_id !== user.id) {
          setError('No tienes permiso para ver esta solicitud');
          return;
        }

        setApplication(app);
      } catch (err) {
        console.error('Error loading application:', err);
        setError('Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id, user]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; color: string; bgColor: string }> = {
      [APPLICATION_STATUS.DRAFT]: { text: 'Borrador', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: { text: 'Faltan Documentos', color: 'text-yellow-900', bgColor: 'bg-yellow-400' },
      [APPLICATION_STATUS.COMPLETA]: { text: 'Completa', color: 'text-green-700', bgColor: 'bg-green-100' },
      [APPLICATION_STATUS.EN_REVISION]: { text: 'En Revisión', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
      [APPLICATION_STATUS.APROBADA]: { text: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100' },
      [APPLICATION_STATUS.RECHAZADA]: { text: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100' },
    };
    return configs[status] || configs[APPLICATION_STATUS.DRAFT];
  };

  const copyUploadLink = async () => {
    if (!application?.public_upload_token) return;

    const link = `${window.location.origin}/documentos/${application.public_upload_token}`;
    await navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-red-600 mb-4">{error || 'Solicitud no encontrada'}</p>
        <Button onClick={() => navigate('/escritorio/seguimiento')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Seguimiento
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const carInfo = application.car_info || {};
  const appData = application.application_data || {};
  const uploadLink = application.public_upload_token
    ? `${window.location.origin}/documentos/${application.public_upload_token}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 no-print overflow-x-hidden">
      {/* Animated Status Bar - Full Width with Negative Margins */}
      <div className={`${statusConfig.bgColor} ${statusConfig.color} h-[60px] flex items-center overflow-hidden sticky top-0 z-50 border-b-2 ${application.status === APPLICATION_STATUS.FALTAN_DOCUMENTOS ? 'border-yellow-600' : 'border-transparent'} -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-6 sm:mb-8 md:mb-10`}>
        <div className="animate-marquee whitespace-nowrap flex items-center">
          <span className="text-lg font-bold px-8">
            {statusConfig.text} • Solicitud #{application.id.substring(0, 8)} • {statusConfig.text} • Solicitud #{application.id.substring(0, 8)} • {statusConfig.text} • Solicitud #{application.id.substring(0, 8)} • {statusConfig.text} • Solicitud #{application.id.substring(0, 8)}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Printable Application */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/escritorio/seguimiento')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintable(!showPrintable)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {showPrintable ? <X className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showPrintable ? 'Ocultar' : 'Ver Solicitud'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePrint}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar PDF
                </Button>
              </div>
            </div>

            {showPrintable && (
              <div className="bg-white rounded-lg border border-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
                <PrintableApplication application={application} />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Document Upload Dropzone - Apple Style */}
            {application.public_upload_token && (
              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    {/* Pulsating Animation Circle */}
                    <div className="relative mx-auto w-24 h-24">
                      <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
                      <div className="absolute inset-0 bg-primary-500 rounded-full animate-pulse opacity-30"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                        <FileText className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Sube tus Documentos</h3>
                      <p className="text-xs text-gray-600">
                        Arrastra archivos aquí o usa el link público
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadLinkVisible(!uploadLinkVisible)}
                        className="w-full border-gray-300 hover:bg-gray-100"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {uploadLinkVisible ? 'Ocultar Link' : 'Mostrar Link Público'}
                      </Button>

                      {uploadLinkVisible && uploadLink && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 break-all font-mono">
                              {uploadLink}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={copyUploadLink}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                          >
                            {copySuccess ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                ¡Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Link
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500 italic">
                            Esta liga solamente es para la carga de documentos. Puedes compartirla con tu asesor o usarla cuando quieras para cargar documentos.
                          </p>
                        </div>
                      )}

                      <Link
                        to={`/documentos/${application.public_upload_token}`}
                        target="_blank"
                        className="block"
                      >
                        <Button variant="default" size="sm" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                          Cargar Documentos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Card */}
            {carInfo._vehicleTitle && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-primary-600" />
                    <h3 className="font-bold text-sm text-gray-900">Tu Vehículo</h3>
                  </div>
                  <img
                    src={carInfo._featureImage || DEFAULT_PLACEHOLDER_IMAGE}
                    alt={carInfo._vehicleTitle}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-bold text-gray-900 text-sm mb-2">{carInfo._vehicleTitle}</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <span className="font-semibold text-gray-900">
                        {carInfo.precio ? formatCurrency(carInfo.precio) : 'N/A'}
                      </span>
                    </div>
                    {appData.down_payment_amount && (
                      <div className="flex justify-between">
                        <span>Enganche:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(appData.down_payment_amount)}
                        </span>
                      </div>
                    )}
                    {appData.loan_term_months && (
                      <div className="flex justify-between">
                        <span>Plazo:</span>
                        <span className="font-semibold text-gray-900">
                          {appData.loan_term_months} meses
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <a
                  href={`https://wa.me/5218187049079?text=Hola,%20quisiera%20dar%20seguimiento%20a%20mi%20solicitud%20${application.id.substring(0, 8)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 !text-white py-6">
                    Contactar por WhatsApp
                  </Button>
                </a>
                <Link to={`/escritorio/aplicacion/${application.id}`}>
                  <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-100">
                    Editar Solicitud
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Survey Benefits Box */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-blue-900 mb-1">
                      ¿Ya completaste la encuesta?
                    </h4>
                    <p className="text-xs text-blue-800 mb-2">
                      Responde nuestra breve encuesta y recibe un cupón de descuento exclusivo válido para tu próxima compra.
                    </p>
                    <Link to="/escritorio/encuesta">
                      <Button variant="outline" size="sm" className="w-full border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500">
                        Ir a Encuesta
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SeguimientoDetailPage;
