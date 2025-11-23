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
    <div className="py-6 sm:py-8 lg:py-12 bg-muted/30 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header with shadcn design system styling */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background border border-input shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background border border-input shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable container with improved mobile visibility */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto overflow-y-visible pb-4 scroll-smooth snap-x snap-mandatory -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none'
          }}
        >
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="snap-start flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[300px]"
            >
              <SimpleVehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default VehicleCarousel;
