import React from 'react';
import { EyeIcon } from '../icons';
import { formatPromotion } from '../../utils/formatters';

interface VehicleCardHeaderProps {
  title: string;
  view_count?: number;
  ordencompra?: string;
  promociones?: string[];
}

const VehicleCardHeader: React.FC<VehicleCardHeaderProps> = ({ title, view_count = 0, ordencompra, promociones }) => (
  <div>
    <div className="flex items-center gap-2 mb-1 flex-wrap">
      {ordencompra && (
        <p className="text-xs font-light text-gray-500 tracking-wider">{ordencompra}</p>
      )}
      {promociones && promociones.length > 0 && promociones.slice(0, 2).map((promo, idx) => {
        const formattedPromo = formatPromotion(promo);
        if (!formattedPromo) return null;

        return (
          <span key={idx} className="text-xs font-medium text-orange-600 border border-orange-600 px-2 py-0.5 rounded-md">
            {formattedPromo}
          </span>
        );
      })}
    </div>
    <h2 className="text-xl font-semibold text-gray-800 group-hover:text-primary-600 transition-colors leading-tight">
      {title}
    </h2>
    {view_count > 100 && (
      <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0 pt-1" title={`${view_count.toLocaleString('es-MX')} vistas`}>
        <EyeIcon className="w-4 h-4" />
        <span>{view_count.toLocaleString('es-MX')}</span>
      </div>
    )}
  </div>
);

export default VehicleCardHeader;
