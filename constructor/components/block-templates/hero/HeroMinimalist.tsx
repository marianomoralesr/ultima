
import React from 'react';
import type { HeroProps, Roundness } from '../../../types';

const getRoundnessClass = (roundness: Roundness) => {
    const mapping: { [key: string]: string } = {
        'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg',
        'xl': 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', 'full': 'rounded-full'
    };
    return mapping[roundness] || 'rounded-xl';
};

const CTA: React.FC<HeroProps> = (props) => {
  const { ctaText, ctaLink, ctaType, ctaStyle, ctaColor, ctaRoundness } = props;

  if (!ctaText) return null;

  if (ctaType === 'link') {
    return (
      <a href={ctaLink || '#'} style={{ color: ctaColor }} className="font-semibold hover:underline">
        {ctaText} &rarr;
      </a>
    );
  }
  
  const baseClasses = `inline-block px-8 py-3 text-base font-medium transition-colors duration-200 shadow-sm`;
  const roundnessClass = getRoundnessClass(ctaRoundness);
  const styleClasses = ctaStyle === 'filled'
    ? `text-white hover:opacity-90`
    : `border-2`;

  const inlineStyles = ctaStyle === 'filled' 
    ? { backgroundColor: ctaColor } 
    : { borderColor: ctaColor, color: ctaColor };

  const hoverStyles = ctaStyle === 'lined' ? {
      onMouseOver: (e: any) => { e.currentTarget.style.backgroundColor = ctaColor; e.currentTarget.style.color = '#FFF'; },
      onMouseOut: (e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = ctaColor; }
  } : {};

  return (
    <a href={ctaLink || '#'} className={`${baseClasses} ${roundnessClass} ${styleClasses}`} style={inlineStyles} {...hoverStyles}>
      {ctaText}
    </a>
  );
};


export const HeroMinimalist: React.FC<HeroProps> = (props) => {
  const { headline, paragraph, image, color, imageRoundness } = props;
  const imageRoundnessClass = getRoundnessClass(imageRoundness);
  return (
    <section className="py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900">
            {headline}
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-lg">
            {paragraph}
          </p>
          <div className="mt-10">
            <CTA {...props} />
          </div>
        </div>
        <div className="hidden lg:block">
          {image && <img
            className={`w-full h-auto shadow-2xl object-cover max-h-[500px] ${imageRoundnessClass}`}
            src={image}
            alt="Showcase"
          />}
        </div>
      </div>
    </section>
  );
};
