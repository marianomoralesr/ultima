import { PLACEHOLDER_IMAGES, DEFAULT_PLACEHOLDER_IMAGE } from './constants';

export const getPlaceholderImage = (
  clasificacionid?: string[] | number,
  carroceria?: string
): string => {
  // Handle string array (from vehicle.clasificacionid)
  if (Array.isArray(clasificacionid) && clasificacionid.length > 0) {
    const clasificacion = clasificacionid[0].toLowerCase().replace(/ /g, '-');
    const placeholder = PLACEHOLDER_IMAGES[clasificacion];
    if (placeholder) return placeholder;
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
    const placeholder = PLACEHOLDER_IMAGES[clasificacion];
    if (placeholder) return placeholder;
  }

  // Fallback to carroceria if clasificacionid doesn't match
  if (carroceria) {
    const carroceriaKey = carroceria.toLowerCase().replace(/ /g, '-');
    const placeholder = PLACEHOLDER_IMAGES[carroceriaKey];
    if (placeholder) return placeholder;
  }

  // Default fallback
  return DEFAULT_PLACEHOLDER_IMAGE;
};
