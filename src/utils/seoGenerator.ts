import type { SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps } from '../types/landing-builder';

type AnySection = SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps;

/**
 * Generates SEO-friendly meta title and description from landing page sections
 */
export function generateSEOFromSections(
  sections: AnySection[],
  customTitle?: string
): { title: string; description: string } {
  // Extract first hero or first section headline as title
  const firstSection = sections[0];
  const autoTitle = firstSection?.headline || 'Landing Page';
  const title = customTitle || autoTitle;

  // Extract first paragraph as description (limit to 160 chars)
  const firstParagraph = firstSection?.paragraph || '';
  const description = firstParagraph.length > 160
    ? firstParagraph.substring(0, 157) + '...'
    : firstParagraph || `Descubre ${autoTitle} - TREFA Auto Inventory`;

  return {
    title: `${title} | TREFA`,
    description
  };
}

/**
 * Sanitizes and validates slug format
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
