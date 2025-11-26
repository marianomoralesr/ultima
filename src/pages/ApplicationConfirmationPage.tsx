import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApplicationService } from '../services/ApplicationService';
import { conversionTracking } from '../services/ConversionTrackingService';
import { supabase } from '../../supabaseClient';
import {
  CheckCircle,
  FileText,
  Upload,
  ExternalLink,
  Home,
  Loader2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PublicUploadLinkCard from '../components/PublicUploadLinkCard';

interface ApplicationData {
  id: string;
  public_upload_token: string | null;
  car_info: any;
  status: string;
}

const ApplicationConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Only show this page if coming from first submit
  const isFirstSubmit = searchParams.get('firstSubmit') === 'true';

  useEffect(() => {
    // Redirect to dashboard if not first submit
    if (!isFirstSubmit) {
      navigate('/escritorio', { replace: true });
      return;
    }

    const loadApplication = async () => {
      if (!user?.id || !id) {
        setError('No se pudo cargar la información de tu solicitud');
        setLoading(false);
        return;
      }

      try {
        const app = await ApplicationService.getApplicationById(user.id, id);
        if (!app) {
          setError('No se encontró la solicitud');
          setLoading(false);
          return;
        }
        setApplication(app);

        // Verificar si ya se disparó el evento de confirmación para esta aplicación
        const { data: shouldDispatch, error: checkError } = await supabase
          .rpc('register_confirmation_event', {
            p_application_id: id,
            p_event_type: 'SolicitudEnviada'
          });

        // Solo disparar evento si es la primera vez
        if (shouldDispatch && !checkError) {
          // Fire conversion event: SolicitudCompleta
          const vehicleInfo = app.car_info;
          await conversionTracking.trackApplication.completed({
            applicationId: id,
            vehicleId: vehicleInfo?._ordenCompra,
            vehicleName: vehicleInfo?._vehicleTitle || undefined,
            vehiclePrice: vehicleInfo?._precioNumerico || 0,
            userId: user.id
          });

          console.log('[ApplicationConfirmation] Evento SolicitudEnviada disparado para aplicación:', id);
        } else {
          console.log('[ApplicationConfirmation] Evento ya fue disparado previamente para aplicación:', id);
        }
      } catch (err) {
        console.error('Error loading application:', err);
        setError('Error al cargar tu solicitud');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id, user?.id, isFirstSubmit, navigate]);

  const publicUrl = application?.public_upload_token
    ? `${window.location.origin}/documentos/${application.public_upload_token}`
    : null;

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la información'}</p>
            <Button onClick={() => navigate('/escritorio')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicleInfo = application.car_info;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            ¡Felicidades! Tu Solicitud ha Sido Enviada
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Estamos revisando tu información. Te notificaremos por correo electrónico y WhatsApp sobre el progreso de tu solicitud.
          </p>
        </div>

        {/* Vehicle Info */}
        {vehicleInfo?._vehicleTitle && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Vehículo de Interés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={vehicleInfo._featureImage}
                  alt={vehicleInfo._vehicleTitle}
                  className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-gray-900">{vehicleInfo._vehicleTitle}</h3>
                  {vehicleInfo._precioFormateado && (
                    <p className="text-sm text-gray-600">{vehicleInfo._precioFormateado}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Próximos Pasos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Carga tus Documentos</h4>
                <p className="text-sm text-gray-600">
                  Para procesar tu solicitud más rápido, necesitamos los siguientes documentos:
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4">
                  <li>• INE (frente y reverso)</li>
                  <li>• Comprobante de domicilio</li>
                  <li>• Comprobante de ingresos</li>
                  <li>• Constancia fiscal</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Revisión de tu Solicitud</h4>
                <p className="text-sm text-gray-600">
                  Nuestro equipo revisará tu información y documentos. Este proceso generalmente toma de 1 a 2 días hábiles.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Aprobación y Siguiente Paso</h4>
                <p className="text-sm text-gray-600">
                  Una vez aprobado tu crédito, podrás separar el vehículo de tu preferencia y coordinar la entrega.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        {publicUrl && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-600" />
                Liga para Carga de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-3">
                  <strong>📧 Te enviamos esta liga por correo electrónico</strong>
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  Puedes usar este enlace en cualquier momento para cargar tus documentos de forma segura.
                  También puedes compartir esta liga para que alguien más suba los documentos por ti.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm text-gray-700 font-mono"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-blue-700 hover:text-blue-800 font-semibold"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir liga de carga de documentos
                </a>
              </div>

              {/* Document Upload via Link */}
              <div className="border-t border-gray-200 pt-4">
                <PublicUploadLinkCard token={application.public_upload_token} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/escritorio')}
            className="w-full"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Volver al Dashboard
          </Button>

          <Link
            to="/escritorio/seguimiento"
            className="block w-full text-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver Estado de mi Solicitud
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Tienes preguntas? <Link to="/contacto" className="text-primary-600 hover:text-primary-700 font-semibold">Contáctanos</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationConfirmationPage;
