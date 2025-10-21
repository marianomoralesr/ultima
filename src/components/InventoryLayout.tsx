import React from 'react';
import { Outlet } from 'react-router-dom';
import { FilterProvider } from '../context/FilterContext';
import { VehicleProvider } from '../context/VehicleContext';

const InventoryLayout: React.FC = () => {
  return (
    <FilterProvider>
      <VehicleProvider>
        <Outlet />
      </VehicleProvider>
    </FilterProvider>
  );
};

export default InventoryLayout;
