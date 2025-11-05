
import React, { useState, useContext } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBuilder } from './builders/HeroBuilder';
import { SectionsBuilder } from './builders/SectionsBuilder';
import { FeaturesBuilder } from './builders/FeaturesBuilder';
import { CarouselBuilder } from './builders/CarouselBuilder';
import { ComparisonBuilder } from './builders/ComparisonBuilder';
import { LandingPageBuilder } from './builders/LandingPageBuilder';
import { BuilderProvider, useBuilderContext } from './context/BuilderContext';
import { PublishedPage } from './components/PublishedPage';

export type BuilderType = 'hero' | 'secciones' | 'features' | 'carrusels' | 'comparacion' | 'landing';

const AppContent: React.FC = () => {
  const { publishedPages } = useBuilderContext();
  const [activeBuilder, setActiveBuilder] = useState<BuilderType>('hero');

  const pathname = window.location.pathname;
  const slug = pathname.substring(1); // Remove leading '/'

  if (slug) {
    const matchedPage = publishedPages.find(p => p.slug === slug);
    if (matchedPage) {
      return <PublishedPage page={matchedPage} />;
    }
  }

  const renderBuilder = () => {
    switch (activeBuilder) {
      case 'hero':
        return <HeroBuilder />;
      case 'secciones':
        return <SectionsBuilder />;
      case 'features':
        return <FeaturesBuilder />;
      case 'carrusels':
        return <CarouselBuilder />;
      case 'comparacion':
        return <ComparisonBuilder />;
      case 'landing':
        return <LandingPageBuilder />;
      default:
        return <HeroBuilder />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="py-5 px-4 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Constructor de Landing Pages - TREFA</h1>
        <p className="text-slate-500">Elige un tipo de componente, guárdalo y luego combínalos en la pestaña "Landing Page" para publicarlos.</p>
      </header>
      
      <Navbar active={activeBuilder} setActive={setActiveBuilder} />

      {renderBuilder()}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <BuilderProvider>
      <AppContent />
    </BuilderProvider>
  );
};

export default App;
