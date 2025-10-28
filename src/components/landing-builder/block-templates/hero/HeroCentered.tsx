
import React from 'react';
import type { HeroProps, Roundness } from '../../../../types/landing-builder';

const getRoundnessClass = (roundness: Roundness) => {
    const mapping: { [key: string]: string } = {
        'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg',
        'xl': 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', 'full': 'rounded-full'
    };
    return mapping[roundness] || 'rounded-md';
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
    : `text-white border-2 hover:bg-white hover:text-slate-900`;
  
  const inlineStyles = ctaStyle === 'filled' 
    ? { backgroundColor: ctaColor } 
    : { borderColor: ctaColor, color: ctaColor };

  const hoverStyles = ctaStyle === 'lined' ? {
      // A bit of a trick to handle hover with inline styles
      onMouseOver: (e: any) => { e.currentTarget.style.backgroundColor = ctaColor; e.currentTarget.style.color = '#FFF'; },
      onMouseOut: (e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = ctaColor; }
  } : {};

  return (
    <a href={ctaLink || '#'} className={`${baseClasses} ${roundnessClass} ${styleClasses}`} style={inlineStyles} {...hoverStyles}>
      {ctaText}
    </a>
  );
};


export const HeroCentered: React.FC<HeroProps> = (props) => {
  const { headline, paragraph, image } = props;
  return (
    <div className="relative bg-slate-900">
      <div className="absolute inset-0">
        {image && <img className="w-full h-full object-cover" src={image} alt="Background" />}
        <div className="absolute inset-0 bg-slate-800 mix-blend-multiply" aria-hidden="true"></div>
      </div>
      <div className="relative max-w-4xl mx-auto py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
          {headline}
        </h1>
        <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-200">
          {paragraph}
        </p>
        <div className="mt-8 sm:mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
          <CTA {...props} />
        </div>
      </div>
    </div>
  );
};
