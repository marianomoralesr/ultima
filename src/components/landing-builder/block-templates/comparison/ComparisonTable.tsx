
import React from 'react';
import type { ComparisonProps } from '../../../../types/landing-builder';

export const ComparisonTable: React.FC<ComparisonProps> = ({ headline, paragraph, features, items, color }) => {
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600">{paragraph}</p>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Característica
                </th>
                {items.map(item => (
                  <th key={item.id} scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {features.map(feature => (
                <tr key={feature.id}>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{feature.name}</td>
                  {items.map(item => (
                    <td key={item.id} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                      {item.values[feature.id] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
