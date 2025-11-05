
import React from 'react';
import type { ComparisonProps } from '../../../types';

export const ComparisonSideBySide: React.FC<ComparisonProps> = ({ headline, paragraph, features, items, color }) => {
  const gridColsClass = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };
  
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
          <p className="mt-4 text-lg text-slate-600">{paragraph}</p>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass[items.length as keyof typeof gridColsClass] || 'lg:grid-cols-4'} gap-8`}>
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg p-6 shadow-md border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.name}</h3>
              <ul className="space-y-3 divide-y divide-slate-100">
                {features.map(feature => (
                  <li key={feature.id} className="flex flex-col pt-3 first:pt-0">
                    <span className="text-sm font-semibold text-slate-500">{feature.name}</span>
                    <span className="text-base text-slate-800">{item.values[feature.id] || '-'}</span>
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
