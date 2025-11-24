import React, { useState } from 'react';
import { Link2, Copy, CheckCircle, QrCode, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

interface PublicUploadLinkCardProps {
  token: string;
  compact?: boolean;
}

const PublicUploadLinkCard: React.FC<PublicUploadLinkCardProps> = ({ token, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const publicUrl = `${window.location.origin}/documentos/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleShowQR = async () => {
    if (!qrDataUrl) {
      try {
        const dataUrl = await QRCode.toDataURL(publicUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e40af', // primary-700
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generando QR:', err);
      }
    }
    setShowQR(!showQR);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
        <Link2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary-900 truncate">
            {publicUrl}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-primary-100 rounded transition-colors flex-shrink-0"
          title="Copiar enlace"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-primary-600" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Link2 className="w-5 h-5 mr-2 text-primary-600" />
            Liga Pública de Documentos
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Comparte este enlace para que te envíen documentos de forma segura
          </p>
        </div>
      </div>

      {/* URL Display */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700 font-mono break-all flex-1">
            {publicUrl}
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleShowQR}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir
        </a>
      </div>

      {/* QR Code Display */}
      {showQR && qrDataUrl && (
        <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg text-center">
          <p className="text-sm text-gray-700 font-semibold mb-3">
            Escanea este código QR para acceder al dropzone
          </p>
          <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-lg shadow-md" />
        </div>
      )}

      {/* Info Section */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">¿Cómo funciona?</p>
            <p className="text-xs text-blue-700 mt-1">
              Cualquier persona con este enlace podrá subir documentos de forma segura.
              Los archivos se asociarán automáticamente a tu solicitud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUploadLinkCard;
