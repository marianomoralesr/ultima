import React, { useState, useEffect } from 'react';
import type { WordPressVehicle } from '../types/types';
import SimpleVehicleCard from './SimpleVehicleCard';
import VehicleCarousel from './VehicleCarousel'; // Import the new carousel component
import { EyeIcon } from './icons';

interface RecentlyViewedProps {
  currentVehicleId?: number;
}

const RECENTLY_VIEWED_KEY = 'trefa_recently_viewed';

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ currentVehicleId }) => {
  const [viewedVehicles, setViewedVehicles] = useState<Partial<WordPressVehicle>[]>([]);

  useEffect(() => {
    const loadRecentlyViewed = () => {
        try {
            const rawData = localStorage.getItem(RECENTLY_VIEWED_KEY);
            if (!rawData) return;

            const recentVehicles: WordPressVehicle[] = JSON.parse(rawData);
            
            if (recentVehicles.length === 0) return;

            const filteredVehicles = recentVehicles.filter(v => v.id !== currentVehicleId);

            setViewedVehicles(filteredVehicles.slice(0, 10));
        } catch (error) {
          console.error("Failed to load recently viewed vehicles:", error);
        }
    };
    loadRecentlyViewed();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === RECENTLY_VIEWED_KEY) {
        loadRecentlyViewed();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentVehicleId]);

  if (viewedVehicles.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Carousel */}
      <div className="lg:hidden">
        <VehicleCarousel vehicles={viewedVehicles as WordPressVehicle[]} title="Vistos Recientemente" />
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:block py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <EyeIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Vistos Recientemente</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {viewedVehicles.map(vehicle => (
              <SimpleVehicleCard key={vehicle.id} vehicle={vehicle as WordPressVehicle} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(RecentlyViewed);
