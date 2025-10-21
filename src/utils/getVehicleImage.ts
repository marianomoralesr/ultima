import type { Vehicle, WordPressVehicle } from '../types/types';
import { DEFAULT_PLACEHOLDER_IMAGE } from './constants';

const placeholders: Record<string, string> = {
  "suv": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/suv-2Artboard-12-trefa.png",
  "pick-up": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/pickup-2Artboard-12-trefa-1.png",
  "sedan": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/sedan-2Artboard-12-trefa.png",
  "sedán": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/sedan-2Artboard-12-trefa.png",
  "hatchback": "https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/hbArtboard-12-trefa.png"};

export function getVehicleImage(vehicle: Partial<Vehicle & WordPressVehicle>): string {
  const parseStringOrArray = (value: string | string[] | undefined): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(s => s.trim());
    return [];
  };

  const potentialImages = [
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
      return imageSource.trim();
    }
    // Handle cases where a field might be an array with one item
    if (Array.isArray(imageSource) && imageSource.length > 0 && imageSource[0] && typeof imageSource[0] === 'string' && imageSource[0].trim() !== '') {
        return imageSource[0].trim();
    }
  }

  // 3. If no valid image URL is found, use the classification-specific placeholder
  const value = Array.isArray(vehicle.clasificacionid)
    ? vehicle.clasificacionid[0]
    : vehicle.clasificacionid;

  const clasificacion = typeof value === "string" ? value.toLowerCase().replace(/ /g, '-') : "";
  return placeholders[clasificacion] ?? DEFAULT_PLACEHOLDER_IMAGE;
}
