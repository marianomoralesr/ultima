export const getPlaceholderImage = (clasificacionid?: number): string => {
  switch (clasificacionid) {
    case 1: // Sedan
      return '/images/sedan-filter.png';
    case 2: // SUV
      return '/images/suv-filter.png';
    case 3: // Hatchback
      return '/images/hatchback-filter.png';
    case 4: // Pickup
      return '/images/pickup-filter.png';
    case 5: // Moto
      return '/images/motos-filter.png';
    default:
      return '/images/sedan-filter.png';
  }
};
