import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, FileText, X, Eye, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  status: string;
}

interface ApplicationInfo {
  id: string;
  status: string;
  created_at: string;
  vehicle: string;
}

const REQUIRED_DOCUMENTS = [
  { id: 'ine_front', name: 'INE (Frente)', required: true },
  { id: 'ine_back', name: 'INE (Reverso)', required: true },
  { id: 'proof_address', name: 'Comprobante de Domicilio', required: true },
  { id: 'proof_income', name: 'Comprobante de Ingresos', required: true },
  { id: 'constancia_fiscal', name: 'Constancia de Situación Fiscal', required: true },
];

const PublicDocumentUploadPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [compressing, setCompressing] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [expirationMessage, setExpirationMessage] = useState<string>('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Cargar información de la aplicación y documentos
  useEffect(() => {
    loadApplicationData();
  }, [token]);

  const loadApplicationData = async () => {
    if (!token) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-document-upload?token=${token}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.expired) {
          setTokenExpired(true);
          setExpirationMessage(errorData.message || 'Este enlace ha expirado');
        }
        throw new Error(errorData.message || 'Token inválido o expirado');
      }

      const data = await response.json();
      setApplication(data.application);
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const compressImageIfNeeded = async (file: File): Promise<File> => {
    // Solo comprimir imágenes
    if (!file.type.startsWith('image/')) {
      return file;
    }

    // Si es menor a 1MB, no comprimir
    if (file.size < 1024 * 1024) {
      return file;
    }

    setCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      console.log('Imagen comprimida:', {
        original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      });

      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      return file;
    } finally {
      setCompressing(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!token) return;

    // Validaciones
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('El archivo es muy grande. El tamaño máximo es 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten PDF, JPG y PNG');
      return;
    }

    setUploading(documentType);
    setUploadProgress({ ...uploadProgress, [documentType]: 0 });

    try {
      // Comprimir imagen si es necesario
      const processedFile = await compressImageIfNeeded(file);

      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('document_type', documentType);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[documentType] || 0;
          if (current < 90) {
            return { ...prev, [documentType]: current + 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-document-upload?token=${token}`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.expired) {
          setTokenExpired(true);
          setExpirationMessage(errorData.message || 'Este enlace ha expirado');
        }
        throw new Error(errorData.error || errorData.message || 'Error al subir archivo');
      }

      const result = await response.json();

      // Actualizar lista de documentos
      setDocuments([...documents, result.document]);
      setUploadProgress({ ...uploadProgress, [documentType]: 100 });

      // Si todos los documentos están completos, recargar datos
      if (result.all_documents_complete) {
        // Esperar un momento y recargar para reflejar el nuevo status
        setTimeout(() => {
          loadApplicationData();
        }, 1000);
      }

      // Limpiar input
      if (fileInputRefs.current[documentType]) {
        fileInputRefs.current[documentType]!.value = '';
      }

      // Mostrar éxito brevemente
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });
      }, 2000);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir archivo');
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    await handleFileUpload(documentType, file);
  };

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType);
    return doc ? { uploaded: true, fileName: doc.file_name, uploadedAt: doc.created_at, doc } : { uploaded: false, fileName: null, uploadedAt: null, doc: null };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          {/* Animación de ondas pulsantes */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-400 opacity-75 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-primary-500 opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-4 rounded-full bg-primary-600 opacity-75 animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="absolute inset-8 rounded-full bg-white flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary-600" />
            </div>
          </div>
          <p className="text-lg text-gray-600">Conectando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            tokenExpired ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <AlertCircle className={`w-10 h-10 ${tokenExpired ? 'text-yellow-600' : 'text-red-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tokenExpired ? '⏰ Enlace Expirado' : 'Acceso Denegado'}
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>

          {tokenExpired && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿Qué hacer?</strong><br/>
                Contacta a tu asesor de TREFA para que reactive el enlace y puedas continuar subiendo tus documentos.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const uploadedCount = REQUIRED_DOCUMENTS.filter(doc => getDocumentStatus(doc.id).uploaded).length;
  const progress = (uploadedCount / REQUIRED_DOCUMENTS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header con logo TREFA */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-10" />
          <div className="text-right">
            <p className="text-xs text-gray-500 font-mono">ID: {application?.id.slice(0, 8)}</p>
            <p className="text-sm font-semibold text-primary-600">{application?.vehicle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Icono animado principal */}
        <div className="text-center mb-8">
          <div className="relative w-40 h-40 mx-auto mb-6">
            {/* Ondas pulsantes de fondo */}
            <div className="absolute inset-0 rounded-full bg-primary-400 opacity-20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-primary-500 opacity-15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-4 rounded-full bg-primary-400 opacity-20 animate-ping" style={{ animationDelay: '1s' }}></div>

            {/* Círculo central */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-2xl">
              <Upload className="w-16 h-16 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carga de Documentos</h1>
          <p className="text-lg text-gray-600 mb-4">Sube tus documentos de manera fácil y segura</p>

          {/* Barra de progreso */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span className="font-semibold">{uploadedCount} de {REQUIRED_DOCUMENTS.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-600 to-primary-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Mensaje de compresión */}
        {compressing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700">
              ⚙️ Comprimiendo imagen para optimizar la subida...
            </p>
          </div>
        )}

        {/* Lista de documentos requeridos */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Documentos Requeridos
            </h2>
            <p className="text-primary-100 text-sm mt-1">
              Todos los documentos son obligatorios para procesar tu solicitud
            </p>
          </div>

          <div className="p-6 space-y-4">
            {REQUIRED_DOCUMENTS.map((doc) => {
              const status = getDocumentStatus(doc.id);
              const isUploading = uploading === doc.id;
              const currentProgress = uploadProgress[doc.id];

              return (
                <DocumentDropzone
                  key={doc.id}
                  doc={doc}
                  status={status}
                  isUploading={isUploading}
                  currentProgress={currentProgress}
                  onFileSelect={(file) => handleFileUpload(doc.id, file)}
                  fileInputRef={(el) => fileInputRefs.current[doc.id] = el}
                  tokenExpired={tokenExpired}
                />
              );
            })}
          </div>

          {/* Información de seguridad */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">🔒 Información Segura</h3>
                <p className="text-sm text-gray-600">
                  Todos tus documentos se almacenan de forma segura y encriptada. Solo el personal autorizado de TREFA podrá acceder a ellos.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceptados: PDF, JPG, PNG • Tamaño máximo: 10MB por archivo
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ✨ Las imágenes grandes se comprimen automáticamente para una subida más rápida
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de completado */}
        {uploadedCount === REQUIRED_DOCUMENTS.length && (
          <div className="mt-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">¡Documentos Completos!</h3>
            <p className="text-green-100">
              Todos los documentos han sido recibidos correctamente. Nos pondremos en contacto contigo pronto.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Autos TREFA • Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

// Componente DocumentDropzone con drag & drop
interface DocumentDropzoneProps {
  doc: { id: string; name: string; required: boolean };
  status: { uploaded: boolean; fileName: string | null; uploadedAt: string | null; doc: Document | null };
  isUploading: boolean;
  currentProgress?: number;
  onFileSelect: (file: File) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  tokenExpired: boolean;
}

const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  doc,
  status,
  isUploading,
  currentProgress,
  onFileSelect,
  fileInputRef,
  tokenExpired,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: status.uploaded || isUploading || tokenExpired,
  });

  return (
    <div
      className={`border-2 rounded-xl p-5 transition-all ${
        status.uploaded
          ? 'border-green-400 bg-green-50'
          : isDragActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-primary-300 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {status.uploaded ? (
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{doc.name}</h3>
            {status.uploaded && (
              <p className="text-sm text-green-700">✓ Subido correctamente</p>
            )}
          </div>
        </div>
      </div>

      {status.uploaded && status.fileName && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-green-200 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 truncate flex-1">{status.fileName}</p>
          </div>
          {status.uploadedAt && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Subido el {new Date(status.uploadedAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      )}

      {!status.uploaded && (
        <div {...getRootProps()}>
          <input {...getInputProps()} ref={fileInputRef} />
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-100'
            } ${isUploading || tokenExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-primary-600' : 'text-gray-400'}`} />
            {isDragActive ? (
              <p className="text-sm font-semibold text-primary-600">Suelta el archivo aquí</p>
            ) : isUploading ? (
              <p className="text-sm text-gray-600">Subiendo archivo...</p>
            ) : tokenExpired ? (
              <p className="text-sm text-gray-500">Enlace expirado - Contacta a tu asesor</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700">
                  Arrastra el archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG o PNG (máx. 10MB)</p>
              </>
            )}
          </div>
        </div>
      )}

      {isUploading && currentProgress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">{currentProgress}%</p>
        </div>
      )}
    </div>
  );
};

export default PublicDocumentUploadPage;
