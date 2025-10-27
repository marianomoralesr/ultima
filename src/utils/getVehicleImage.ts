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

  // Build potential images array, handling both strings and arrays
  const buildImagesList = () => {
    const images = [];

    // 0. HIGHEST PRIORITY: Car Studio images if flag is enabled
    if (useCarStudioImages) {
      const carStudioFeature = (vehicle as any).car_studio_feature_image;
      if (carStudioFeature) images.push(carStudioFeature);
      images.push(...parseStringOrArray((vehicle as any).car_studio_gallery));
    }

    // 1. Prioritize explicit feature images and their variants
    // Handle both string and array formats
    const addImage = (img: any) => {
      if (Array.isArray(img)) {
        images.push(...img);
      } else if (img) {
        images.push(img);
      }
    };

    addImage(vehicle.feature_image);
    addImage(vehicle.feature_image_url);
    addImage(vehicle.thumbnail_webp);
    addImage(vehicle.thumbnail);
    addImage(vehicle.feature_image_webp);

    // 2. Fallback to the first image from any gallery
    images.push(...parseStringOrArray(vehicle.galeria_exterior));
    images.push(...parseStringOrArray(vehicle.fotos_exterior_url));
    images.push(...parseStringOrArray(vehicle.galeria_interior));
    images.push(...parseStringOrArray(vehicle.fotos_interior_url));

    return images;
  };

  const potentialImages = buildImagesList();

  // Find the first valid, non-empty URL from the prioritized list
  for (const imageSource of potentialImages) {
    if (imageSource && typeof imageSource === 'string' && imageSource.trim() !== '' && imageSource.trim() !== '#ERROR!') {
      // Convert Supabase URL to CDN URL
      return getCdnUrl(imageSource.trim());
    }
  }

  // 3. If no valid image URL is found, use the classification-specific placeholder
  const value = Array.isArray(vehicle.clasificacionid)
    ? vehicle.clasificacionid[0]
    : vehicle.clasificacionid;

  const clasificacion = typeof value === "string" ? value.toLowerCase().replace(/ /g, '-') : "";
  return PLACEHOLDER_IMAGES[clasificacion] ?? DEFAULT_PLACEHOLDER_IMAGE;
}
