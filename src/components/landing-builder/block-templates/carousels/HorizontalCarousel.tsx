
import React, { useState } from 'react';
import type { CarouselProps } from '../../../../types/landing-builder';

export const HorizontalCarousel: React.FC<CarouselProps> = ({ headline, paragraph, images, color }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (images.length === 0) {
     return (
        <section className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor: color }}>
            <div className="text-center text-slate-500">Añade imágenes para ver el carrusel.</div>
        </section>
     )
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
          <p className="mt-4 text-lg text-slate-600">{paragraph}</p>
        </div>
        <div className="mt-12 relative">
          <div className="overflow-hidden rounded-lg shadow-xl">
            <div className="whitespace-nowrap transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {images.map((image, index) => (
                <div key={image.id} className="inline-block w-full align-top">
                  <img src={image.src} alt={`Slide ${index + 1}`} className="w-full h-auto object-cover aspect-video max-h-[600px]" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={goToPrevious} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-lg hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-[#FF6801]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToNext} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-lg hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-[#FF6801]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
};
