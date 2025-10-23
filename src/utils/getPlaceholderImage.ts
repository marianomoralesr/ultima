import { PLACEHOLDER_IMAGES, DEFAULT_PLACEHOLDER_IMAGE } from './constants';

export const getPlaceholderImage = (clasificacionid?: string[] | number): string => {
  // Handle string array (from vehicle.clasificacionid)
  if (Array.isArray(clasificacionid) && clasificacionid.length > 0) {
    const clasificacion = clasificacionid[0].toLowerCase().replace(/ /g, '-');
    return PLACEHOLDER_IMAGES[clasificacion] ?? DEFAULT_PLACEHOLDER_IMAGE;
  }

  // Handle number (legacy support)
  if (typeof clasificacionid === 'number') {
    const numberToStringMap: Record<number, string> = {
      1: 'sedan',
      2: 'suv',
      3: 'hatchback',
      4: 'pickup',
      5: 'motos',
    };
    const clasificacion = numberToStringMap[clasificacionid];
    return PLACEHOLDER_IMAGES[clasificacion] ?? DEFAULT_PLACEHOLDER_IMAGE;
  }

  // Default fallback
  return DEFAULT_PLACEHOLDER_IMAGE;
};
