import React from 'react';
import type { FeaturesProps } from '../../../../types/landing-builder';

const PlaceholderIcon = () => (
    <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
  

export const FeaturesCards: React.FC<FeaturesProps> = ({ headline, paragraph, features, color }) => {
  return (
    <section className="py-4 @sm:py-8 @md:py-12 @lg:py-16 px-4 @sm:px-6 @lg:px-8" style={{ backgroundColor: color }}>
        <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-lg @sm:text-xl @md:text-3xl @lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {headline}
                </h2>
                <p className="mt-2 @sm:mt-3 text-base @sm:text-lg text-slate-600">
                    {paragraph}
                </p>
            </div>
            <div className="mt-4 @sm:mt-6 @md:mt-10 grid gap-3 @sm:gap-6 grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4">
                {features.map((feature) => (
                    <div key={feature.id} className="pt-6">
                        <div className="flow-root bg-white/50 backdrop-blur-sm rounded-lg px-6 pb-8 shadow-md h-full">
                            <div className="-mt-6">
                                <div>
                                    <span className="inline-flex items-center justify-center p-3 bg-[#FF6801] rounded-md shadow-lg">
                                        <PlaceholderIcon />
                                    </span>
                                </div>
                                <h3 className="mt-6 @sm:mt-8 text-base @sm:text-lg font-bold text-slate-900 tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 @sm:mt-5 text-sm @sm:text-base text-slate-600">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};