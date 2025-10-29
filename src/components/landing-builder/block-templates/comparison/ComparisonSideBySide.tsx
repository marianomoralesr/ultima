
import React from 'react';
import type { ComparisonProps } from '../../../../types/landing-builder';

export const ComparisonSideBySide: React.FC<ComparisonProps> = ({ headline, paragraph, features, items, color }) => {
  const gridColsClass = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  return (
    <section className="py-4 sm:py-8 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-slate-600">{paragraph}</p>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass[items.length as keyof typeof gridColsClass] || 'lg:grid-cols-4'} gap-3 sm:gap-6`}>
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg p-4 sm:p-5 md:p-6 shadow-md border border-slate-200">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{item.name}</h3>
              <ul className="space-y-2 sm:space-y-3 divide-y divide-slate-100">
                {features.map(feature => (
                  <li key={feature.id} className="flex flex-col pt-2 sm:pt-3 first:pt-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">{feature.name}</span>
                    <span className="text-sm sm:text-base text-slate-800">{item.values[feature.id] || '-'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
