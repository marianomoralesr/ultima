import React from 'react';

interface VehicleCardSkeletonProps {
  isGrid?: boolean;
}

const VehicleCardSkeleton: React.FC<VehicleCardSkeletonProps> = ({ isGrid = false }) => {
  if (isGrid) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="pt-2">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-60 md:h-auto bg-gray-200" />
        <div className="flex-grow p-5 space-y-4">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="h-10 w-32 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCardSkeleton;
