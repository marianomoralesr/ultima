import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppIcon, HeartIcon, SolidHeartIcon } from '../icons';

interface VehicleCardActionsProps {
  isSeparado: boolean;
  ordencompra?: string;
  whatsappUrl: string;
  onToggleFavorite: (e: React.MouseEvent) => Promise<void>;
  isFavorite: boolean;
  marca?: string;
  carroceria?: string;
  precio?: number;
}

const VehicleCardActions: React.FC<VehicleCardActionsProps> = ({
  isSeparado,
  ordencompra,
  whatsappUrl,
  onToggleFavorite,
  isFavorite,
  marca,
  carroceria,
  precio,
}) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleFinancingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSeparado) return;

    if (session) {
      const urlWithParams = ordencompra ? `/escritorio/aplicacion?ordencompra=${ordencompra}` : '/escritorio/aplicacion';
      navigate(urlWithParams);
    } else {
      const redirectPath = ordencompra ? `/escritorio/aplicacion?ordencompra=${ordencompra}` : '/escritorio/aplicacion';
      localStorage.setItem('loginRedirect', redirectPath);
      const loginUrl = ordencompra ? `/acceder?ordencompra=${ordencompra}` : '/acceder';
      navigate(loginUrl);
    }
  };

  const handleSimilarVehiclesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams();

    if (marca) {
      params.append('marca', marca);
    }

    if (carroceria) {
      params.append('carroceria', carroceria);
    }

    if (precio) {
      // Set price range to ±20% of current price
      const minPrice = Math.round(precio * 0.8);
      const maxPrice = Math.round(precio * 1.2);
      params.append('preciomin', minPrice.toString());
      params.append('preciomax', maxPrice.toString());
    }

    const url = `/autos${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(url);
  };

  return (
    <div className="flex flex-col gap-2 z-20 relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleFinancingClick}
          aria-disabled={isSeparado}
          data-gtm-id="card-list-finance"
          className={`inline-block text-center font-semibold px-6 py-3 rounded-lg transition-colors text-sm ${isSeparado ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
        >
          Financiar
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-gtm-id="card-list-whatsapp"
          className="p-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Contactar por WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </a>
        <button
          onClick={onToggleFavorite}
          data-gtm-id="card-list-favorite"
          className="p-3 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Añadir a favoritos"
        >
          {isFavorite ? <SolidHeartIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
        </button>
      </div>

      {isSeparado && (
        <button
          onClick={handleSimilarVehiclesClick}
          data-gtm-id="card-list-similar-vehicles"
          className="w-full text-center font-semibold px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
        >
          Ver autos similares disponibles
        </button>
      )}
    </div>
  );
};

export default VehicleCardActions;