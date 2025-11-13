import React from 'react';
import { WordPressVehicle } from '../types/types';
import SimpleVehicleCard from './SimpleVehicleCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VehicleCarouselProps {
  vehicles: WordPressVehicle[];
  title: string;
}

const VehicleCarousel: React.FC<VehicleCarouselProps> = ({ vehicles, title }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <div className="py-8 sm:py-12 bg-gray-50 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-2xl font-black text-gray-900">{title}</h2>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 border relative z-20 transition-colors touch-manipulation"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 border relative z-20 transition-colors touch-manipulation"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none'
          }}
        >
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="snap-start snap-always flex-shrink-0 w-[280px] sm:w-[300px] md:w-[280px] lg:w-[260px] first:ml-0">
              <SimpleVehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        div[ref]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default VehicleCarousel;
