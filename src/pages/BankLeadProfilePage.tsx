import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BankService } from '../services/BankService';
import { BANKS, BANK_APPLICATION_STATUSES } from '../types/bank';
import type { BankRepLeadDetails } from '../types/bank';
import { formatPrice } from '../utils/formatters';

const BankLeadProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [leadDetails, setLeadDetails] = useState<BankRepLeadDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadLeadDetails();
    }
  }, [id]);

  const loadLeadDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await BankService.getLeadDetails(id);

      if (!data.success) {
        setError(data.error || 'Error al cargar detalles del cliente');
        return;
      }

      setLeadDetails(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar detalles del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !leadDetails?.assignment) return;

    setActionLoading(true);
    setError(null);

    try {
      await BankService.updateApplicationStatus(
        leadDetails.assignment.id,
        selectedStatus,
        feedbackMessage || undefined
      );

      // Reload data
      await loadLeadDetails();
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setSelectedStatus('');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const url = await BankService.getDocumentSignedUrl(doc.file_path);
      setDocumentUrl(url);
      setSelectedDocument(doc);
    } catch (err: any) {
      setError(err.message || 'Error al cargar documento');
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const url = await BankService.getDocumentSignedUrl(doc.file_path);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Error al descargar documento');
    }
  };

  const getStatusColor = (status?: string): string => {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentIcon = (docType: string): JSX.Element => {
    const className = "w-6 h-6";

    if (docType.includes('INE')) {
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      );
    }

    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (error && !leadDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/escritorio/bancos/clientes')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  const lead = leadDetails?.lead;
  const application = leadDetails?.application?.[0];
  const bankProfile = leadDetails?.bank_profile;
  const documents = leadDetails?.documents || [];
  const assignment = leadDetails?.assignment;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/escritorio/bancos/clientes')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Información del Cliente</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nombre completo</p>
                    <p className="font-semibold text-gray-900">
                      {lead?.first_name} {lead?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Correo electrónico</p>
                    <p className="font-semibold text-gray-900">{lead?.email}</p>
                  </div>
                  {lead?.phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                      <p className="font-semibold text-gray-900">{lead.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de registro</p>
                    <p className="font-semibold text-gray-900">
                      {lead?.created_at ? new Date(lead.created_at).toLocaleDateString('es-MX') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle and Application Info */}
            {application && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Información del Vehículo</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Vehículo solicitado</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {application.car_info?.vehicleTitle || 'Sin información'}
                      </p>
                    </div>
                    {application.car_info?.price && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Precio</p>
                        <p className="font-semibold text-gray-900">{formatPrice(application.car_info.price)}</p>
                      </div>
                    )}
                    {application.car_info?.year && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Año</p>
                        <p className="font-semibold text-gray-900">{application.car_info.year}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estado de solicitud</p>
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fecha de solicitud</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(application.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>

                  {/* Personal Info from Application */}
                  {application.personal_info && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-4">Información personal</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {application.personal_info.curp && (
                          <div>
                            <p className="text-gray-600">CURP</p>
                            <p className="font-medium text-gray-900">{application.personal_info.curp}</p>
                          </div>
                        )}
                        {application.personal_info.rfc && (
                          <div>
                            <p className="text-gray-600">RFC</p>
                            <p className="font-medium text-gray-900">{application.personal_info.rfc}</p>
                          </div>
                        )}
                        {application.personal_info.address && (
                          <div className="col-span-2">
                            <p className="text-gray-600">Dirección</p>
                            <p className="font-medium text-gray-900">{application.personal_info.address}</p>
                          </div>
                        )}
                        {application.personal_info.monthly_income && (
                          <div>
                            <p className="text-gray-600">Ingreso mensual</p>
                            <p className="font-medium text-gray-900">{formatPrice(application.personal_info.monthly_income)}</p>
                          </div>
                        )}
                        {application.personal_info.employment_status && (
                          <div>
                            <p className="text-gray-600">Situación laboral</p>
                            <p className="font-medium text-gray-900">{application.personal_info.employment_status}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
              </div>
              <div className="p-6">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay documentos disponibles</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-gray-600">
                            {getDocumentIcon(doc.document_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.document_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Descargar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bank Profile */}
            {bankProfile && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">Perfil Bancario</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-2xl font-bold text-gray-900">{bankProfile.score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nivel de riesgo</p>
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      bankProfile.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                      bankProfile.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bankProfile.risk_level === 'low' ? 'Bajo' :
                       bankProfile.risk_level === 'medium' ? 'Medio' : 'Alto'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Status */}
            {assignment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">Estado de Asignación</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Estado actual</p>
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Asignada el</p>
                    <p className="font-medium text-gray-900">
                      {new Date(assignment.assigned_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                {BANK_APPLICATION_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      setSelectedStatus(status.value);
                      setShowFeedbackModal(true);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                      status.color === 'green'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : status.color === 'red'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmar: {BANK_APPLICATION_STATUSES.find(s => s.value === selectedStatus)?.label}
            </h3>
            <p className="text-gray-600 mb-4">
              Opcionalmente, agrega un mensaje para el equipo de ventas:
            </p>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Escribe tus comentarios aquí... (opcional)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackMessage('');
                  setSelectedStatus('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {actionLoading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDocument && documentUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">{selectedDocument.document_type}</h3>
              <button
                onClick={() => {
                  setSelectedDocument(null);
                  setDocumentUrl(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={documentUrl}
                className="w-full h-full"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankLeadProfilePage;
