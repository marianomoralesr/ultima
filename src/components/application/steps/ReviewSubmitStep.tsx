import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CheckCircle, DollarSign, User, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import type { StepperType } from '../EnhancedApplication';

interface ReviewSubmitStepProps {
  stepper: StepperType;
  control: any;
  getValues: any;
  setValue: any;
  profile: any;
  vehicleInfo: any;
  bank: string | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  submissionError: string | null;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  stepper,
  control,
  getValues,
  setValue,
  profile,
  vehicleInfo,
  bank,
  onSubmit,
  isSubmitting,
  submissionError
}) => {
  const [loanTerm, setLoanTerm] = useState(60);
  const [downPaymentRaw, setDownPaymentRaw] = useState('');

  // Get vehicle pricing
  const vehiclePrice = vehicleInfo?.precio || vehicleInfo?._precio || 0;
  const minDownPayment = vehicleInfo?.enganchemin || vehicleInfo?._enganchemin || Math.round(vehiclePrice * 0.25);
  const recommendedDownPayment = vehicleInfo?.enganche_recomendado || vehicleInfo?._enganche_recomendado || Math.round(vehiclePrice * 0.40);
  const maxTerm = vehicleInfo?.plazomax || 60;

  const formatNumber = (value: number | string): string => {
    const numStr = String(value).replace(/[^0-9]/g, '');
    if (!numStr) return '';
    return parseInt(numStr, 10).toLocaleString('es-MX');
  };

  const parseFormattedNumber = (formatted: string): number => {
    const numStr = formatted.replace(/[^0-9]/g, '');
    return numStr ? parseInt(numStr, 10) : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  };

  // Initialize down payment
  useEffect(() => {
    if (minDownPayment > 0 && !downPaymentRaw) {
      setDownPaymentRaw(formatNumber(minDownPayment));
      setValue('down_payment_amount', minDownPayment);
    }
    const initialTerm = Math.min(maxTerm, 60);
    if (loanTerm !== initialTerm) {
      setLoanTerm(initialTerm);
    }
  }, [minDownPayment, downPaymentRaw, setValue, maxTerm, loanTerm]);

  // Update form values
  useEffect(() => {
    const downPaymentValue = parseFormattedNumber(downPaymentRaw);
    setValue('loan_term_months', loanTerm);
    setValue('down_payment_amount', downPaymentValue);
  }, [loanTerm, downPaymentRaw, setValue]);

  const allTermOptions = [12, 24, 36, 48, 60];
  const termOptions = allTermOptions.filter(term => term <= maxTerm);

  const applicationData = getValues();
  const address = applicationData.current_address || profile?.address || '';
  const colony = applicationData.current_colony || profile?.colony || '';
  const city = applicationData.current_city || profile?.city || '';
  const state = applicationData.current_state || profile?.state || '';
  const zipCode = applicationData.current_zip_code || profile?.zip_code || '';

  const fullAddress = [address, colony, city, state, zipCode ? `C.P. ${zipCode}` : '']
    .filter(part => part && part.trim())
    .join(', ');

  return (
    <CardContent className="col-span-5 flex flex-col gap-6 p-6 md:col-span-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa y Envía tu Solicitud</h2>
        <p className="text-sm text-gray-600">Verifica que toda la información sea correcta antes de enviar.</p>
      </div>

      {/* Financing Preferences Section */}
      {vehiclePrice > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-6 border-2 border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            Preferencias de Financiamiento
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Loan Term */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Plazo del Crédito (meses)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {termOptions.map(term => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setLoanTerm(term)}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                      loanTerm === term
                        ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Enganche
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                <input
                  type="text"
                  value={downPaymentRaw}
                  onChange={(e) => {
                    const formatted = formatNumber(e.target.value);
                    setDownPaymentRaw(formatted);
                  }}
                  placeholder="0"
                  className="block w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 pl-7"
                />
              </div>
              <button
                type="button"
                onClick={() => setDownPaymentRaw(formatNumber(recommendedDownPayment))}
                className="mt-2 w-full px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors"
              >
                Usar Recomendado (40%): {formatCurrency(recommendedDownPayment)}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Mínimo: {formatCurrency(minDownPayment)}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg p-4 border border-primary-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600">Precio del Auto</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(vehiclePrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Enganche</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(parseFormattedNumber(downPaymentRaw))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Monto a Financiar</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(vehiclePrice - parseFormattedNumber(downPaymentRaw))}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle and Bank Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Vehículo Seleccionado</p>
            <p className="font-semibold text-primary-700">{vehicleInfo?._vehicleTitle || 'No seleccionado'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Banco Recomendado</p>
            <p className="font-semibold text-primary-700">{bank || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Data */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2 text-primary-600" />
            Datos Personales
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Nombre</p>
              <p className="font-semibold text-gray-800">{profile?.first_name} {profile?.last_name} {profile?.mother_last_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">RFC</p>
              <p className="font-semibold text-gray-800 font-mono">{profile?.rfc || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="font-semibold text-gray-800">{profile?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dirección</p>
              <p className="font-semibold text-gray-800 text-xs">{fullAddress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Employment Data */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-primary-600" />
            Datos Laborales
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Empresa</p>
              <p className="font-semibold text-gray-800">{applicationData.company_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Puesto</p>
              <p className="font-semibold text-gray-800">{applicationData.job_title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ingreso Neto</p>
              <p className="font-semibold text-gray-800">${applicationData.net_monthly_income || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Antigüedad</p>
              <p className="font-semibold text-gray-800">{applicationData.job_seniority || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Error */}
      {submissionError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Error al Enviar</p>
              <p className="text-sm text-red-800 mt-1">{submissionError}</p>
              {submissionError.includes("vehículo") && (
                <Button
                  type="button"
                  onClick={() => stepper.goTo('vehicle-selection')}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Ir a Selección de Vehículo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-4 mt-6">
        <Button variant="secondary" size="lg" onClick={stepper.prev}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Enviar Solicitud
            </>
          )}
        </Button>
      </div>
    </CardContent>
  );
};

export default ReviewSubmitStep;
