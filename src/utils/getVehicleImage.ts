import type { Vehicle, WordPressVehicle } from '../types/types';
import { DEFAULT_PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGES } from './constants';
import { getCdnUrl } from './imageUrl';

export function getVehicleImage(vehicle: Partial<Vehicle & WordPressVehicle>): string {
  const parseStringOrArray = (value: string | string[] | undefined): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(s => s.trim());
    return [];
  };

  // Check if we should use Car Studio images
  const useCarStudioImages = (vehicle as any).use_car_studio_images === true;

  const potentialImages = [
    // 0. HIGHEST PRIORITY: Car Studio images if flag is enabled
    ...(useCarStudioImages ? [
      (vehicle as any).car_studio_feature_image,
      ...parseStringOrArray((vehicle as any).car_studio_gallery),
    ] : []),
    // 1. Prioritize explicit feature images and their variants
    vehicle.feature_image,
    vehicle.feature_image_url,
    vehicle.thumbnail_webp,
    vehicle.thumbnail,
    vehicle.feature_image_webp,
    // 2. Fallback to the first image from any gallery
    ...parseStringOrArray(vehicle.galeria_exterior),
    ...parseStringOrArray(vehicle.fotos_exterior_url),
    ...parseStringOrArray(vehicle.galeria_interior),
    ...parseStringOrArray(vehicle.fotos_interior_url),
  ];

  // Find the first valid, non-empty URL from the prioritized list
  for (const imageSource of potentialImages) {
    if (imageSource && typeof imageSource === 'string' && imageSource.trim() !== '' && imageSource.trim() !== '#ERROR!') {
      // Convert Supabase URL to CDN URL
      return getCdnUrl(imageSource.trim());
    }
    // Handle cases where a field might be an array with one item
    if (Array.isArray(imageSource) && imageSource.length > 0 && imageSource[0] && typeof imageSource[0] === 'string' && imageSource[0].trim() !== '') {
        // Convert Supabase URL to CDN URL
        return getCdnUrl(imageSource[0].trim());
    }
  }

  // 3. If no valid image URL is found, use the classification-specific placeholder
  const value = Array.isArray(vehicle.clasificacionid)
    ? vehicle.clasificacionid[0]
    : vehicle.clasificacionid;

  const clasificacion = typeof value === "string" ? value.toLowerCase().replace(/ /g, '-') : "";
  return PLACEHOLDER_IMAGES[clasificacion] ?? DEFAULT_PLACEHOLDER_IMAGE;
}
