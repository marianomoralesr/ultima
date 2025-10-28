
export type CtaType = 'button' | 'link';
export type CtaStyle = 'filled' | 'lined';
export type Roundness = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export interface BlockProps {
  headline: string;
  paragraph: string;
  image: string | null;
  color: string;
  video: string | null;
  ctaText: string;
  ctaLink: string;
  ctaType: CtaType;
  ctaStyle: CtaStyle;
  ctaColor: string;
  ctaRoundness: Roundness;
  imageRoundness: Roundness;
}
export type SavedBlockProps = BlockProps & { id: string; layout: 'side' | 'centered' | 'standard' | 'side-left'; };


export interface HeroProps {
  headline: string;
  paragraph: string;
  ctaText: string;
  image: string | null;
  color: string;
  ctaLink: string;
  ctaType: CtaType;
  ctaStyle: CtaStyle;
  ctaColor: string;
  ctaRoundness: Roundness;
  imageRoundness: Roundness;
}
export type SavedHeroProps = HeroProps & { id: string; layout: 'centered' | 'split' | 'minimalist'; };


export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  icon?: string;
  image?: string | null;
}
export interface FeaturesProps {
    headline: string;
    paragraph: string;
    features: FeatureItem[];
    color: string;
}
export type SavedFeaturesProps = FeaturesProps & { id: string; layout: 'cards' | 'alternating' | 'grid'; };

export interface CarouselImage {
  id: number;
  src: string;
}
export interface CarouselProps {
  headline: string;
  paragraph: string;
  images: CarouselImage[];
  color: string;
}
export type SavedCarouselProps = CarouselProps & { id: string; layout: 'horizontal' | 'centered-slider' | 'gallery'; };


export interface ComparisonFeature {
    id: number;
    name: string;
}
export interface ComparisonItem {
    id: number;
    name: string;
    values: { [featureId: number]: string };
}
export interface ComparisonProps {
    headline: string;
    paragraph: string;
    features: ComparisonFeature[];
    items: ComparisonItem[];
    color: string;
}
export type SavedComparisonProps = ComparisonProps & { id: string; layout: 'table' | 'side-by-side' | 'pricing-boxes'; };


export type PublishedPage = {
  slug: string;
  sections: (SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps)[];
};
