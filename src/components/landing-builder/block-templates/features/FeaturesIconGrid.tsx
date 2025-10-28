import React from 'react';
import type { FeaturesProps } from '../../../../types/landing-builder';

const PlaceholderIcon = () => (
    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m-3.5 14.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
);
  
export const FeaturesIconGrid: React.FC<FeaturesProps> = ({ headline, paragraph, features, color }) => {
    return (
        <section className="py-8 sm:py-12 md:py-16 lg:py-20" style={{ backgroundColor: color }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center lg:text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                        {headline}
                    </h2>
                    <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg md:text-xl text-slate-600 mx-auto lg:mx-auto">
                        {paragraph}
                    </p>
                </div>
                <div className="mt-8 sm:mt-10">
                    <dl className="space-y-8 sm:space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:gap-x-8 lg:gap-y-10">
                    {features.map((feature) => (
                        <div key={feature.id} className="relative">
                        <dt>
                            <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-[#FF6801] text-white">
                                <PlaceholderIcon />
                            </div>
                            <p className="ml-14 sm:ml-16 text-base sm:text-lg leading-6 font-bold text-slate-900">{feature.title}</p>
                        </dt>
                        <dd className="mt-2 ml-14 sm:ml-16 text-sm sm:text-base text-slate-600">{feature.description}</dd>
                        </div>
                    ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};