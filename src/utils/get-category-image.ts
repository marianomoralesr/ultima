const categoryImages: Record<string, string> = {
  'suv': '/images/suv-filter.png',
  'sedan': '/images/sedan-filter.png',
  'sedán': '/images/sedan-filter.png', // Support both with and without accent
  'pick-up': '/images/pickup-filter.png',
  'hatchback': '/images/hatchback-filter.png',
  'motos': '/images/motocicleta-filter.png',
  'motocicleta': '/images/motocicleta-filter.png', // Support both variations
  'motocicletas': '/images/motocicleta-filter.png',
};

export const getCategoryImage = (category: string, value: string): string => {
  const normalizedValue = value.toLowerCase().replace(/\s+/g, '-');
  return categoryImages[normalizedValue] || '/images/icono.png';
};
