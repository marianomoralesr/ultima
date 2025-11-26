import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';

interface CompletedStepProps {
  vehicleInfo: any;
  applicationId: string | null;
}

const CompletedStep: React.FC<CompletedStepProps> = ({ vehicleInfo, applicationId }) => {
  return (
    <CardContent className="col-span-5 flex flex-col items-center justify-center gap-6 p-6 md:col-span-3 min-h-[600px]">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>

      {/* Success Message */}
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Solicitud Enviada Exitosamente!
        </h1>
        <p className="text-base text-gray-600">
          Tu solicitud está en revisión. Te notificaremos por email y WhatsApp sobre el estado de tu solicitud.
        </p>
      </div>

      {/* Vehicle Info */}
      {vehicleInfo?._vehicleTitle && (
        <div className="w-full max-w-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-gray-500 mb-2">Vehículo de Interés</p>
          <div className="flex items-center gap-3">
            <img
              src={vehicleInfo._featureImage}
              alt={vehicleInfo._vehicleTitle}
              className="w-24 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{vehicleInfo._vehicleTitle}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="w-full max-w-lg bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Próximo Paso:</strong> Revisaremos tu solicitud y documentos. Una vez aprobado tu crédito, podrás separar el vehículo de tu preferencia.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-lg space-y-3 mt-4">
        <Link
          to="/escritorio/seguimiento"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
        >
          Ver Estado de Solicitud
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
          title="Disponible después de la aprobación"
        >
          Separar Vehículo
          <span className="text-xs">(Disponible al aprobar)</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="w-full max-w-lg pt-4 border-t border-gray-200 text-center">
        <Link
          to="/explorar"
          className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
        >
          Explorar Más Vehículos →
        </Link>
      </div>

      {/* Thank You Message */}
      <div className="w-full max-w-lg text-center mt-6">
        <p className="text-sm text-gray-500">
          Gracias por confiar en TREFA. Nuestro equipo trabajará para brindarte la mejor opción de financiamiento.
        </p>
      </div>
    </CardContent>
  );
};

export default CompletedStep;
