
import React from 'react';
// FIX: Renamed imported PublishedPage type to avoid conflict with component name.
import type { SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps, PublishedPage as PublishedPageType } from '../../types/landing-builder';
import { HeroCentered } from './block-templates/hero/HeroCentered';
import { HeroSplit } from './block-templates/hero/HeroSplit';
import { HeroMinimalist } from './block-templates/hero/HeroMinimalist';
import { BlockSideBySide } from './block-templates/BlockSideBySide';
import { BlockImageTopCentered } from './block-templates/BlockImageTopCentered';
import { BlockImageTopStandard } from './block-templates/BlockImageTopStandard';
import { BlockSideBySideImageLeft } from './block-templates/BlockSideBySideImageLeft';
import { FeaturesCards } from './block-templates/features/FeaturesCards';
import { FeaturesAlternating } from './block-templates/features/FeaturesAlternating';
import { FeaturesIconGrid } from './block-templates/features/FeaturesIconGrid';
import { HorizontalCarousel } from './block-templates/carousels/HorizontalCarousel';
import { CenteredCarousel } from './block-templates/carousels/CenteredCarousel';
import { GalleryCarousel } from './block-templates/carousels/GalleryCarousel';
import { ComparisonTable } from './block-templates/comparison/ComparisonTable';
import { ComparisonSideBySide } from './block-templates/comparison/ComparisonSideBySide';
import { ComparisonPricingBoxes } from './block-templates/comparison/ComparisonPricingBoxes';


interface PublishedPageProps {
    page: PublishedPageType;
}

const renderSection = (section: SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps) => {
    switch (section.layout) {
        // Hero layouts
        case 'split':
            return <HeroSplit {...section as SavedHeroProps} />;
        case 'minimalist':
            return <HeroMinimalist {...section as SavedHeroProps} />;
        // Section layouts
        case 'side':
            return <BlockSideBySide {...section as SavedBlockProps} />;
        case 'side-left':
            return <BlockSideBySideImageLeft {...section as SavedBlockProps} />;
        case 'standard':
            return <BlockImageTopStandard {...section as SavedBlockProps} />;
        case 'centered':
             if ('ctaText' in section) {
                return <HeroCentered {...section as SavedHeroProps} />;
             }
             return <BlockImageTopCentered {...section as SavedBlockProps} />;
        // Features layouts
        case 'cards':
            return <FeaturesCards {...section as SavedFeaturesProps} />;
        case 'alternating':
            return <FeaturesAlternating {...section as SavedFeaturesProps} />;
        case 'grid':
            return <FeaturesIconGrid {...section as SavedFeaturesProps} />;
        // Carousel layouts
        case 'horizontal':
            return <HorizontalCarousel {...section as SavedCarouselProps} />;
        case 'centered-slider':
            return <CenteredCarousel {...section as SavedCarouselProps} />;
        case 'gallery':
            return <GalleryCarousel {...section as SavedCarouselProps} />;
        // Comparison layouts
        case 'table':
            return <ComparisonTable {...section as SavedComparisonProps} />;
        case 'side-by-side':
            return <ComparisonSideBySide {...section as SavedComparisonProps} />;
        case 'pricing-boxes':
            return <ComparisonPricingBoxes {...section as SavedComparisonProps} />;
        default:
            return null;
    }
};

export const PublishedPage: React.FC<PublishedPageProps> = ({ page }) => {
    return (
        <main>
            {page.sections.map(section => (
                <div key={section.id}>
                    {renderSection(section)}
                </div>
            ))}
            <footer className="text-center py-4 bg-slate-50">
                <a href="/" className="text-sm text-slate-500 hover:text-[#FF6801]">
                    Volver al Constructor
                </a>
            </footer>
        </main>
    );
};
