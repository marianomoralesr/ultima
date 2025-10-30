

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../types/types';
import { HeartIcon, TagIcon, ShieldCheckIcon, FuelIcon, GaugeIcon, CogIcon } from './icons';
import ImageCarousel from './ImageCarousel'; // Import the new ImageCarousel
import { useFavorites } from '../hooks/useFavorites';
import { useQueryClient } from '@tanstack/react-query';
import VehicleService from '../services/VehicleService';
import { getVehicleImage } from '../utils/getVehicleImage';
import { formatPrice, formatPromotion, getPromotionStyles, formatMileage } from '../utils/formatters';

interface VehicleGridCardProps {
  vehicle: Vehicle;
}

const SpecBadge: React.FC<{ children: React.ReactNode, icon?: React.ElementType }> = ({ children, icon: Icon }) => (
    <span className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        {children}
    </span>
);

const VehicleGridCard: React.FC<VehicleGridCardProps> = ({ vehicle }) => {
  const queryClient = useQueryClient();
  const hasSlug = vehicle.slug && vehicle.slug.trim() !== '';
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const favorite = isFavorite(vehicle.id);
  const isSeparado = vehicle.separado === true;
  const isPopular = vehicle.view_count >= 1000;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(vehicle.id);
  };

  const prefetchVehicle = () => {
    if (hasSlug) {
      queryClient.prefetchQuery({
        queryKey: ['vehicle', vehicle.slug],
        queryFn: () => VehicleService.getVehicleBySlug(vehicle.slug),
      });
    }
  };

  const imagesForCarousel = useMemo(() => {
    const mainImage = getVehicleImage(vehicle);
    const imageUrls = [
      mainImage,
      ...(vehicle.galeria_exterior || []),
      ...(vehicle.galeria_interior || []),
    ];
    // Deduplicate and filter out any falsy values
    return [...new Set(imageUrls.filter(Boolean))];
  }, [vehicle]);

  const CardContent = (
    <div
      onMouseEnter={prefetchVehicle}
      className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ${!isPopular ? 'overflow-hidden' : ''} group flex flex-col relative ${isSeparado ? 'opacity-70' : ''} ${isPopular ? 'popular-card' : ''}`}
    >
        <div className="block relative">
            <ImageCarousel
              images={imagesForCarousel}
              alt={vehicle.titulo}
              isSeparado={isSeparado}
              garantia={vehicle.garantia}
              sucursal={vehicle.ubicacion}
              clasificacionid={vehicle.clasificacionid}
              carroceria={vehicle.carroceria}
              className="aspect-[4/3]"
            />
            {isSeparado && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="bg-gray-900 text-white text-sm font-bold py-1.5 px-4 rounded-md shadow-lg tracking-wider">SEPARADO</span>
                </div>
            )}
            <div className="absolute top-3 right-3 z-20">
                 <button
                    onClick={handleToggleFavorite}
                    data-gtm-id="card-grid-favorite"
                    disabled={isToggling === vehicle.id}
                    className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-md disabled:opacity-50"
                    aria-label={favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                 >
                     <HeartIcon className={`w-5 h-5 ${favorite ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                 </button>
            </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
            <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {vehicle.ordencompra && (
                        <p className="text-xs font-medium uppercase text-gray-400 tracking-wide">{vehicle.ordencompra}</p>
                    )}
                    {vehicle.promociones && vehicle.promociones.length > 0 && vehicle.promociones.slice(0, 2).map((promo, idx) => {
                        const formattedPromo = formatPromotion(promo);
                        if (!formattedPromo) return null;

                        return (
                            <span key={idx} className="text-xs font-medium text-orange-600 border border-orange-600 px-2 py-0.5 rounded-md">
                                {formattedPromo}
                            </span>
                        );
                    })}
                </div>
                <h3 className="font-bold text-base text-gray-900 group-hover:text-primary-600 transition-colors truncate mb-2" title={vehicle.titulo}>
                    {vehicle.titulo} {(vehicle.autoano || vehicle.year) && <span className="text-gray-600">{vehicle.autoano || vehicle.year}</span>}
                </h3>

                {/* Specs badges in white section */}
                <div className="flex flex-wrap gap-3 mb-3 pb-3 border-b border-gray-100">
                    {vehicle.kilometraje > 0 && <SpecBadge icon={GaugeIcon}>{formatMileage(vehicle.kilometraje)}</SpecBadge>}
                    {vehicle.transmision && <SpecBadge icon={CogIcon}>{vehicle.transmision}</SpecBadge>}
                    {vehicle.combustible && <SpecBadge icon={FuelIcon}>{vehicle.combustible}</SpecBadge>}
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex items-baseline justify-between mb-2">
                    <p className="text-xl font-bold text-gray-900">
                        {formatPrice(vehicle.precio)}
                    </p>
                    {vehicle.enganchemin > 0 && (
                        <p className="text-xs text-gray-500">
                            Desde {formatPrice(vehicle.enganchemin)}
                        </p>
                    )}
                </div>
            </div>
        </div>

        {hasSlug && (
          <Link to={`/autos/${vehicle.slug}`} data-gtm-id="card-grid-view-details" className="absolute inset-0 z-10">
            <span className="sr-only">Ver detalles de {vehicle.title}</span>
          </Link>
        )}
    </div>
  );

  return <div className="h-full">{CardContent}</div>
};

export default React.memo(VehicleGridCard);