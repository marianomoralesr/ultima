
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps, PublishedPage } from '../types';

interface BuilderContextType {
    savedHeros: SavedHeroProps[];
    savedSections: SavedBlockProps[];
    savedFeatures: SavedFeaturesProps[];
    savedCarousels: SavedCarouselProps[];
    savedComparisons: SavedComparisonProps[];
    publishedPages: PublishedPage[];
    addHero: (hero: SavedHeroProps) => void;
    addSection: (section: SavedBlockProps) => void;
    addFeature: (feature: SavedFeaturesProps) => void;
    addCarousel: (carousel: SavedCarouselProps) => void;
    addComparison: (comparison: SavedComparisonProps) => void;
    addPublishedPage: (page: PublishedPage) => void;
    removeHero: (id: string) => void;
    removeSection: (id: string) => void;
    removeFeature: (id: string) => void;
    removeCarousel: (id: string) => void;
    removeComparison: (id: string) => void;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [savedHeros, setSavedHeros] = useState<SavedHeroProps[]>([]);
    const [savedSections, setSavedSections] = useState<SavedBlockProps[]>([]);
    const [savedFeatures, setSavedFeatures] = useState<SavedFeaturesProps[]>([]);
    const [savedCarousels, setSavedCarousels] = useState<SavedCarouselProps[]>([]);
    const [savedComparisons, setSavedComparisons] = useState<SavedComparisonProps[]>([]);
    const [publishedPages, setPublishedPages] = useState<PublishedPage[]>([]);


    const addHero = (hero: SavedHeroProps) => setSavedHeros(prev => [...prev, hero]);
    const addSection = (section: SavedBlockProps) => setSavedSections(prev => [...prev, section]);
    const addFeature = (feature: SavedFeaturesProps) => setSavedFeatures(prev => [...prev, feature]);
    const addCarousel = (carousel: SavedCarouselProps) => setSavedCarousels(prev => [...prev, carousel]);
    const addComparison = (comparison: SavedComparisonProps) => setSavedComparisons(prev => [...prev, comparison]);
    
    const addPublishedPage = (page: PublishedPage) => {
      // Prevent duplicate slugs
      if (publishedPages.some(p => p.slug === page.slug)) {
        alert(`Error: La URL "${page.slug}" ya existe. Por favor, elige otra.`);
        return;
      }
      setPublishedPages(prev => [...prev, page]);
    };

    const removeHero = (id: string) => setSavedHeros(prev => prev.filter(h => h.id !== id));
    const removeSection = (id: string) => setSavedSections(prev => prev.filter(s => s.id !== id));
    const removeFeature = (id: string) => setSavedFeatures(prev => prev.filter(f => f.id !== id));
    const removeCarousel = (id: string) => setSavedCarousels(prev => prev.filter(c => c.id !== id));
    const removeComparison = (id: string) => setSavedComparisons(prev => prev.filter(c => c.id !== id));

    return (
        <BuilderContext.Provider value={{
            savedHeros,
            savedSections,
            savedFeatures,
            savedCarousels,
            savedComparisons,
            publishedPages,
            addHero,
            addSection,
            addFeature,
            addCarousel,
            addComparison,
            addPublishedPage,
            removeHero,
            removeSection,
            removeFeature,
            removeCarousel,
            removeComparison,
        }}>
            {children}
        </BuilderContext.Provider>
    );
};

export const useBuilderContext = (): BuilderContextType => {
    const context = useContext(BuilderContext);
    if (context === undefined) {
        throw new Error('useBuilderContext must be used within a BuilderProvider');
    }
    return context;
};
