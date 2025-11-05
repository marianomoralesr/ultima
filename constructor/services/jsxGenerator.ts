
import type { BlockProps, HeroProps, FeaturesProps, CarouselProps, ComparisonProps, SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps } from '../types';

const formatString = (str: string) => str.replace(/`/g, '\\`').replace(/\$/g, '\\$');

const getRoundnessClass = (roundness: string) => {
    const mapping: { [key: string]: string } = {
        'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg',
        'xl': 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', 'full': 'rounded-full'
    };
    return mapping[roundness] || 'rounded-lg';
};

const getCtaComponent = (props: BlockProps | HeroProps) => {
    const { ctaText, ctaLink, ctaType, ctaStyle, ctaColor, ctaRoundness } = props;
    if (!ctaText || !ctaLink) return '';

    if (ctaType === 'link') {
        return `
    <a href="${ctaLink}" className="mt-8 inline-block font-semibold text-[${ctaColor}] hover:underline">
      {props.ctaText} &rarr;
    </a>
`.trim();
    }

    const baseClasses = "px-6 py-3 text-base font-medium transition-colors duration-200";
    const roundnessClass = getRoundnessClass(ctaRoundness);
    let styleClasses = '';
    
    if (ctaStyle === 'filled') {
        styleClasses = `text-white bg-[${ctaColor}] hover:opacity-90`;
    } else { // lined
        styleClasses = `text-[${ctaColor}] border-2 border-[${ctaColor}] hover:bg-[${ctaColor}] hover:text-white`;
    }

    return `
    <div className="mt-8">
      <a href="${ctaLink}" className="${baseClasses} ${roundnessClass} ${styleClasses}">
        {props.ctaText}
      </a>
    </div>
`.trim();
};


// SECTION BUILDER TEMPLATES

export const getSideBySideJsx = (props: BlockProps): string => {
  const { color, imageRoundness } = props;
  const imageRoundnessClass = getRoundnessClass(imageRoundness);
  const ctaJsx = getCtaComponent(props);

  return `
const SectionSideBySide = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="md:order-2">
          <div className="aspect-w-4 aspect-h-3 ${imageRoundnessClass} overflow-hidden shadow-2xl">
            <img 
              className="object-cover w-full h-full max-h-[500px]" 
              src={props.image} 
              alt={props.headline} 
            />
          </div>
        </div>
        <div className="md:order-1">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            {props.headline}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {props.paragraph}
          </p>
          ${ctaJsx}
        </div>
      </div>
    </div>
  </section>
);
`.trim();
};

export const getSideBySideImageLeftJsx = (props: BlockProps): string => {
  const { color, imageRoundness } = props;
  const imageRoundnessClass = getRoundnessClass(imageRoundness);
  const ctaJsx = getCtaComponent(props);
  return `
const SectionSideBySideImageLeft = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="md:order-1">
          <div className="aspect-w-4 aspect-h-3 ${imageRoundnessClass} overflow-hidden shadow-2xl">
            <img 
              className="object-cover w-full h-full max-h-[500px]" 
              src={props.image} 
              alt={props.headline} 
            />
          </div>
        </div>
        <div className="md:order-2">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            {props.headline}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {props.paragraph}
          </p>
          ${ctaJsx}
        </div>
      </div>
    </div>
  </section>
);
`.trim();
};


export const getImageTopCenteredJsx = (props: BlockProps): string => {
    const { color, imageRoundness } = props;
    const imageRoundnessClass = getRoundnessClass(imageRoundness);
    const ctaJsx = getCtaComponent(props);
    return `
const SectionImageTopCentered = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8 aspect-w-16 aspect-h-9 ${imageRoundnessClass} overflow-hidden shadow-2xl">
        <img 
          className="object-cover w-full h-full max-h-[500px]" 
          src={props.image} 
          alt={props.headline} 
        />
      </div>
      <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
        {props.headline}
      </h2>
      <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">
        {props.paragraph}
      </p>
      ${ctaJsx}
    </div>
  </section>
);
`.trim();
};

export const getImageTopStandardJsx = (props: BlockProps): string => {
    const { color, imageRoundness } = props;
    const imageRoundnessClass = getRoundnessClass(imageRoundness);
    const ctaJsx = getCtaComponent(props);
    return `
const SectionImageTopStandard = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 aspect-w-16 aspect-h-9 ${imageRoundnessClass} overflow-hidden shadow-2xl">
        <img 
          className="object-cover w-full h-full max-h-[500px]" 
          src={props.image} 
          alt={props.headline} 
        />
      </div>
      <div className="text-left">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          {props.headline}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          {props.paragraph}
        </p>
        ${ctaJsx}
      </div>
    </div>
  </section>
);
`.trim();
};

export const getVideoJsx = (props: BlockProps): string => {
    const { video } = props;
    return `
const VideoSection = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 bg-black">
    <div className="max-w-4xl mx-auto">
      <video 
        src={props.video} 
        controls 
        autoPlay 
        loop 
        muted 
        className="w-full rounded-lg shadow-2xl"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  </section>
);
`.trim();
};

// HERO BUILDER TEMPLATES

export const getHeroCenteredJsx = (props: HeroProps): string => {
  const ctaJsx = getCtaComponent(props).replace('mt-8', 'mt-10'); // Adjust margin for hero
  return `
const HeroCentered = (props) => (
  <div className="relative overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="absolute inset-0">
      <img
        className="w-full h-full object-cover"
        src={props.image}
        alt="Background"
      />
      <div className="absolute inset-0 bg-gray-900 bg-opacity-60" aria-hidden="true"></div>
    </div>
    <div className="relative max-w-4xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
        {props.headline}
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-200">
        {props.paragraph}
      </p>
      ${ctaJsx}
    </div>
  </div>
);
`.trim();
};

export const getHeroSplitJsx = (props: HeroProps): string => {
  const ctaJsx = getCtaComponent(props).replace('mt-8', 'mt-10');
  const imageRoundnessClass = getRoundnessClass(props.imageRoundness);
  return `
const HeroSplit = (props) => (
  <section className="overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="py-12 px-4 sm:px-6 lg:py-24 lg:px-8 flex items-center">
          <div className="max-w-lg mx-auto lg:mx-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
               {props.headline}
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
               {props.paragraph}
            </p>
            ${ctaJsx}
          </div>
        </div>
        <div className="relative h-64 lg:h-auto ${imageRoundnessClass} overflow-hidden">
           <img
            className="absolute inset-0 w-full h-full object-cover"
            src={props.image}
            alt="Hero image"
          />
        </div>
      </div>
    </div>
  </section>
);
`.trim();
};

export const getHeroMinimalistJsx = (props: HeroProps): string => {
  const ctaJsx = getCtaComponent(props).replace('mt-8', 'mt-10');
  const imageRoundnessClass = getRoundnessClass(props.imageRoundness);
  return `
const HeroMinimalist = (props) => (
  <section className="py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {props.headline}
        </h1>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-lg">
          {props.paragraph}
        </p>
        ${ctaJsx}
      </div>
      <div className="hidden lg:block">
        <img
          className="w-full h-auto ${imageRoundnessClass} shadow-2xl object-cover"
          src={props.image}
          alt="Showcase"
        />
      </div>
    </div>
  </section>
);
`.trim();
};


// FEATURES BUILDER TEMPLATES
export const getFeaturesCardsJsx = (props: FeaturesProps): string => {
  return `
const PlaceholderIcon = () => (
  <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const FeaturesCards = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
        <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {props.features.map((feature) => (
          <div key={feature.id} className="pt-6">
            <div className="flow-root bg-white/50 backdrop-blur-sm rounded-lg px-6 pb-8 shadow-md h-full">
              <div className="-mt-6">
                <div><span className="inline-flex items-center justify-center p-3 bg-[#FF6801] rounded-md shadow-lg"><PlaceholderIcon /></span></div>
                <h3 className="mt-8 text-lg font-bold text-slate-900 tracking-tight">{feature.title}</h3>
                <p className="mt-5 text-base text-slate-600">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
`.trim();
};
export const getFeaturesAlternatingJsx = (props: FeaturesProps): string => {
  return `
const FeaturesAlternating = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 overflow-hidden" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
      {props.features.map((feature, index) => (
        <div key={feature.id} className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className={\`\${index % 2 === 0 ? 'lg:order-2' : ''}\`}>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">{feature.title}</h3>
            <p className="mt-3 text-lg text-slate-600">{feature.description}</p>
          </div>
          <div className={\`mt-10 lg:mt-0 \${index % 2 === 0 ? 'lg:order-1' : ''}\`}>
            <img className="rounded-lg shadow-xl w-full h-auto object-cover" src={feature.image || "https://via.placeholder.com/600x400"} alt={feature.title} />
          </div>
        </div>
      ))}
    </div>
  </section>
);
`.trim();
};
export const getFeaturesIconGridJsx = (props: FeaturesProps): string => {
    return `
const PlaceholderIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m-3.5 14.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);
const FeaturesIconGrid = (props) => (
  <section className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
        <p className="mt-4 max-w-2xl text-xl text-slate-600 lg:mx-auto">{props.paragraph}</p>
      </div>
      <div className="mt-10">
        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
          {props.features.map((feature) => (
            <div key={feature.id} className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#FF6801] text-white"><PlaceholderIcon /></div>
                <p className="ml-16 text-lg leading-6 font-bold text-slate-900">{feature.title}</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-slate-600">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </section>
);
`.trim();
};

// --- CAROUSEL BUILDER TEMPLATES ---

export const getHorizontalCarouselJsx = (props: CarouselProps) => `
const HorizontalCarousel = (props) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const images = props.images || [];

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
  
  if (images.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: props.color }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
          <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
        </div>
        <div className="mt-12 relative">
          <div className="overflow-hidden rounded-lg">
            <div className="whitespace-nowrap transition-transform duration-500 ease-in-out" style={{ transform: \`translateX(-\${currentIndex * 100}%)\` }}>
              {images.map((image, index) => (
                <div key={image.id} className="inline-block w-full">
                  <img src={image.src} alt={\`Slide \${index + 1}\`} className="w-full h-auto object-cover aspect-video" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={goToPrevious} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-lg hover:bg-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToNext} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-lg hover:bg-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
};
`;

export const getCenteredCarouselJsx = (props: CarouselProps) => `
const CenteredCarousel = (props) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const images = props.images || [];

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

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

  if (images.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: props.color }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
          <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
        </div>
        <div className="mt-12 relative flex items-center justify-center">
          <button onClick={goToPrevious} className="absolute -left-4 z-10 bg-white/70 p-2 rounded-full shadow-lg hover:bg-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-full h-96 flex items-center justify-center overflow-hidden [perspective:1000px]">
             {images.map((image, index) => {
                const offset = index - currentIndex;
                const rotateY = offset * 20; // degrees
                const translateX = offset * (100 / 3); // percentage
                const scale = offset === 0 ? 1 : 0.8;
                const zIndex = images.length - Math.abs(offset);
                const opacity = Math.abs(offset) > 1 ? 0 : 1;
                return (
                    <div key={image.id} className="absolute w-2/3 h-full transition-all duration-500 ease-out"
                        style={{ transform: \`translateX(\${translateX}%) rotateY(\${rotateY}deg) scale(\${scale})\`, zIndex, opacity }}>
                         <img src={image.src} alt={\`Slide \${index + 1}\`} className="w-full h-full object-cover rounded-xl shadow-2xl" />
                    </div>
                );
             })}
          </div>
          <button onClick={goToNext} className="absolute -right-4 z-10 bg-white/70 p-2 rounded-full shadow-lg hover:bg-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
};
`;

export const getGalleryCarouselJsx = (props: CarouselProps) => `
const GalleryCarousel = (props) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const images = props.images || [];
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  if (images.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: props.color }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
          <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
        </div>
        <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg shadow-2xl">
            {images.length > 0 && <img src={images[currentIndex]?.src} alt="Main view" className="w-full h-full object-cover" />}
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {images.map((image, index) => (
              <button key={image.id} onClick={() => goToSlide(index)} className={\`aspect-w-1 aspect-h-1 w-full rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6801] \${currentIndex === index ? 'ring-2 ring-offset-2 ring-[#FF6801]' : ''}\`}>
                <img src={image.src} alt={\`Thumbnail \${index + 1}\`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
`;

// --- COMPARISON BUILDER TEMPLATES ---

export const getComparisonTableJsx = (props: ComparisonProps) => `
const ComparisonTable = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
        <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Característica</th>
              {props.items.map(item => (
                <th key={item.id} scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{item.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {props.features.map(feature => (
              <tr key={feature.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{feature.name}</td>
                {props.items.map(item => (
                  <td key={item.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.values[feature.id] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);
`;

export const getComparisonSideBySideJsx = (props: ComparisonProps) => `
const ComparisonSideBySide = (props) => (
  <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
        <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
      </div>
      <div className={\`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-\${props.items.length} gap-8\`}>
        {props.items.map(item => (
          <div key={item.id} className="bg-white rounded-lg p-6 shadow-md border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.name}</h3>
            <ul className="space-y-3">
              {props.features.map(feature => (
                <li key={feature.id} className="flex flex-col">
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
`;

export const getComparisonPricingBoxesJsx = (props: ComparisonProps) => `
const CheckIcon = () => (
    <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);
const ComparisonPricingBoxes = (props) => (
  <section className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor: props.color }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{props.headline}</h2>
        <p className="mt-4 text-lg text-slate-600">{props.paragraph}</p>
      </div>
      <div className={\`grid grid-cols-1 lg:grid-cols-\${props.items.length} gap-8 items-start\`}>
        {props.items.map((item, index) => (
          <div key={item.id} className={\`relative flex flex-col h-full p-8 rounded-2xl bg-white shadow-xl border \${index === 1 ? 'border-[#FF6801]' : 'border-slate-200'}\`}>
            {index === 1 && <div className="absolute top-0 -translate-y-1/2 px-3 py-1 text-sm font-semibold tracking-wide text-white uppercase bg-[#FF6801] rounded-full">Popular</div>}
            <h3 className="text-2xl font-bold text-slate-900">{item.name}</h3>
            <ul className="mt-6 space-y-4 flex-1">
              {props.features.map(feature => (
                <li key={feature.id} className="flex items-start">
                  <div className="flex-shrink-0"><CheckIcon /></div>
                  <span className="ml-3 text-base text-slate-600">{item.values[feature.id] || feature.name}</span>
                </li>
              ))}
            </ul>
            <a href="#" className={\`mt-8 block w-full px-6 py-3 text-lg font-semibold text-center rounded-lg \${index === 1 ? 'text-white bg-[#FF6801] hover:bg-[#E65C00]' : 'text-[#FF6801] bg-orange-50 hover:bg-orange-100'}\`}>
              Elegir {item.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);
`;

// --- FULL PAGE GENERATOR ---

const getComponentCode = (section: SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps) => {
    switch (section.layout) {
        case 'centered':
            return 'ctaText' in section ? getHeroCenteredJsx(section) : getImageTopCenteredJsx(section as SavedBlockProps);
        case 'split': return getHeroSplitJsx(section as SavedHeroProps);
        case 'minimalist': return getHeroMinimalistJsx(section as SavedHeroProps);
        case 'side': return getSideBySideJsx(section as SavedBlockProps);
        case 'side-left': return getSideBySideImageLeftJsx(section as SavedBlockProps);
        case 'standard': return getImageTopStandardJsx(section as SavedBlockProps);
        case 'cards': return getFeaturesCardsJsx(section as SavedFeaturesProps);
        case 'alternating': return getFeaturesAlternatingJsx(section as SavedFeaturesProps);
        case 'grid': return getFeaturesIconGridJsx(section as SavedFeaturesProps);
        case 'horizontal': return getHorizontalCarouselJsx(section as SavedCarouselProps);
        case 'centered-slider': return getCenteredCarouselJsx(section as SavedCarouselProps);
        case 'gallery': return getGalleryCarouselJsx(section as SavedCarouselProps);
        case 'table': return getComparisonTableJsx(section as SavedComparisonProps);
        case 'side-by-side': return getComparisonSideBySideJsx(section as SavedComparisonProps);
        case 'pricing-boxes': return getComparisonPricingBoxesJsx(section as SavedComparisonProps);
        default: return '';
    }
}

const getComponentName = (layout: string, count: number) => {
    const name = layout.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    return name.charAt(0).toUpperCase() + name.slice(1) + count;
}


export const getFullPageJsx = (sections: (SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps)[]) => {
    const componentCounts: Record<string, number> = {};
    const componentCodes = new Set<string>();
    const componentInstances: { name: string; propsName: string; props: any;}[] = [];

    for (const section of sections) {
        const baseLayout = section.layout.startsWith('side') ? 'side' : section.layout;
        componentCounts[baseLayout] = (componentCounts[baseLayout] || 0) + 1;
        
        const componentName = getComponentName(section.layout, componentCounts[baseLayout]);
        const propsName = `${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Props`;

        componentCodes.add(getComponentCode(section));
        componentInstances.push({ name: componentName, propsName, props: section });
    }

    const propsDeclarations = componentInstances.map(inst => 
        `const ${inst.propsName} = ${JSON.stringify(inst.props, (key, value) => key === 'id' || key === 'layout' ? undefined : value, 2)};`
    ).join('\n\n');

    const renderedComponents = componentInstances.map(inst => 
        `      <${inst.name} {...${inst.propsName}} />`
    ).join('\n');

    return `
import React from 'react';

// Paste the following component definitions into your file.
// Note: Some components might share names if you saved multiple of the same layout.
// You may need to rename them to avoid conflicts.

${[...componentCodes].join('\n\n// -----\n\n')}

// Props for each component instance
${propsDeclarations}

const LandingPage = () => {
  return (
    <main>
${renderedComponents}
    </main>
  );
};

export default LandingPage;
`.trim();
};
