
import React from 'react';
import type { HeroProps, Roundness } from '../../../../types/landing-builder';

const getRoundnessClass = (roundness: Roundness) => {
    const mapping: { [key: string]: string } = {
        'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg',
        'xl': 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', 'full': 'rounded-full'
    };
    return mapping[roundness] || 'rounded-none';
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


export const HeroSplit: React.FC<HeroProps> = (props) => {
  const { headline, paragraph, image, color, imageRoundness } = props;
  const imageRoundnessClass = getRoundnessClass(imageRoundness);
  return (
    <section className="overflow-hidden" style={{ backgroundColor: color }}>
      <div className="max-w-none">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="py-4 sm:py-6 md:py-10 lg:py-24 px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-lg mx-auto lg:mx-0 lg:ml-auto lg:pl-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                {headline}
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600">
                {paragraph}
              </p>
              <div className="mt-6 sm:mt-8 md:mt-10">
                <CTA {...props} />
              </div>
            </div>
          </div>
          <div className={`relative h-64 sm:h-80 lg:h-auto min-h-[300px] sm:min-h-[400px] lg:max-h-[640px] ${imageRoundnessClass} overflow-hidden`}>
            {image && <img
              className="absolute inset-0 w-full h-full object-cover"
              src={image}
              alt="Hero image"
            />}
          </div>
        </div>
      </div>
    </section>
  );
};
