import sedanPlaceholder from '/public/images/sedan-filter.png';
import suvPlaceholder from '/public/images/suv-filter.png';
import hatchbackPlaceholder from '/public/images/hatchback-filter.png';
import pickupPlaceholder from '/public/images/pickup-filter.png';
import motosPlaceholder from '/public/images/motos-filter.png';

export const getPlaceholderImage = (clasificacionid?: number): string => {
  switch (clasificacionid) {
    case 1: // Sedan
      return sedanPlaceholder;
    case 2: // SUV
      return suvPlaceholder;
    case 3: // Hatchback
      return hatchbackPlaceholder;
    case 4: // Pickup
      return pickupPlaceholder;
    case 5: // Moto
      return motosPlaceholder;
    default:
      return sedanPlaceholder;
  }
};
