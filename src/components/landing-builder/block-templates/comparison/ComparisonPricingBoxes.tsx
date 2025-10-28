
import React from 'react';
import type { ComparisonProps } from '../../../../types/landing-builder';

const CheckIcon = () => (
    <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);

export const ComparisonPricingBoxes: React.FC<ComparisonProps> = ({ headline, paragraph, features, items, color }) => {
    const gridColsClass = {
        1: 'lg:grid-cols-1 max-w-sm mx-auto',
        2: 'lg:grid-cols-2 max-w-3xl mx-auto',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
    };

    return (
        <section className="py-8 sm:py-12 md:py-16 lg:py-20" style={{ backgroundColor: color }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600">{paragraph}</p>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start ${gridColsClass[items.length as keyof typeof gridColsClass] || 'lg:grid-cols-4'}`}>
                    {items.map((item, index) => (
                        <div key={item.id} className={`relative flex flex-col h-full p-6 sm:p-8 rounded-2xl bg-white shadow-xl border ${index === 1 && items.length > 1 ? 'border-[#FF6801]' : 'border-slate-200'}`}>
                            {index === 1 && items.length > 1 && <div className="absolute top-0 -translate-y-1/2 px-3 py-1 text-xs sm:text-sm font-semibold tracking-wide text-white uppercase bg-[#FF6801] rounded-full">Popular</div>}
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{item.name}</h3>
                            <ul className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 flex-1">
                                {features.map(feature => (
                                    <li key={feature.id} className="flex items-start">
                                        <div className="flex-shrink-0"><CheckIcon /></div>
                                        <span className="ml-3 text-sm sm:text-base text-slate-600">{item.values[feature.id] || feature.name}</span>
                                    </li>
                                ))}
                            </ul>
                            <a href="#" className={`mt-6 sm:mt-8 block w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg font-semibold text-center rounded-lg ${index === 1 && items.length > 1 ? 'text-white bg-[#FF6801] hover:bg-[#E65C00]' : 'text-[#FF6801] bg-orange-50 hover:bg-orange-100'}`}>
                                Elegir {item.name}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
