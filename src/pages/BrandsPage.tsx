import React from 'react';
import { Link } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import { BRAND_LOGOS } from '../utils/constants';
import useSEO from '../hooks/useSEO';
import MainLayout from '../components/MainLayout';

import { Loader2 } from 'lucide-react';

const BrandsPage: React.FC = () => {
  useSEO({
    title: 'Todas las Marcas de Autos Seminuevos | TREFA',
    description: 'Explora todas las marcas de autos seminuevos disponibles en TREFA. Encuentra la marca que buscas y ve nuestro inventario.',
    keywords: 'marcas de autos, autos por marca, inventario de autos, seminuevos, trefa',
  });

  const { vehicles, isLoading } = useVehicles();

  const brandCounts = React.useMemo(() => {
    if (!vehicles) return [];
    const counts: { [key: string]: number } = {};
    vehicles.forEach(vehicle => {
      if (vehicle.marca) {
        counts[vehicle.marca] = (counts[vehicle.marca] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [vehicles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Nuestras Marcas</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brandCounts.map(([brand, count]) => (
            <Link
              key={brand}
              to={`/marcas/${brand.toLowerCase()}`}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <img
                src={BRAND_LOGOS[brand] || '/images/trefalogo.png'}
                alt={`${brand} logo`}
                className="h-16 w-auto object-contain mb-4"
              />
              <span className="font-bold text-gray-800">{brand}</span>
              <span className="text-sm text-gray-500">({count} {count === 1 ? 'auto' : 'autos'})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;
