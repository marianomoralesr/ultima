import React, { useState, useEffect } from 'react';
import { getCdnUrl, getResponsiveSrcSet, ImageOptions } from '../utils/imageUrl';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  onClick?: () => void;
  /** Image transformation options for CDN */
  imageOptions?: ImageOptions;
  /** Enable responsive images with srcset */
  responsive?: boolean;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Priority loading - use eager loading instead of lazy for critical images */
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  objectFit = 'cover',
  onClick,
  imageOptions,
  responsive = false,
  sizes,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Validate src prop type before processing
  const validatedSrc = React.useMemo(() => {
    if (!src) return '';

    // Handle arrays (take first element)
    if (Array.isArray(src)) {
      console.warn('LazyImage: src prop is an array, using first element', { alt, src });
      return src[0] || '';
    }

    // Handle non-string values
    if (typeof src !== 'string') {
      console.error('LazyImage: src prop must be a string', { alt, src, type: typeof src });
      return '';
    }

    return src;
  }, [src, alt]);

  // Convert URL to use CDN if configured - use smaller sizes for faster loading
  const defaultOptions = !imageOptions ? {
    width: priority ? 600 : 400, // Smaller thumbnails for cards
    quality: 85,
    format: 'auto' as const
  } : imageOptions;

  const cdnSrc = getCdnUrl(validatedSrc, defaultOptions);
  const srcSet = responsive ? getResponsiveSrcSet(validatedSrc) : undefined;

  useEffect(() => {
    if (!validatedSrc || validatedSrc.trim() === '') {
      setHasError(true);
      return;
    }

    // Handle cached images - check if image is already complete
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [validatedSrc]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('LazyImage: Failed to load image.', {
      src,
      alt,
      srcType: typeof src,
      srcValue: src,
      error: event
    });
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`overflow-hidden bg-gray-200 ${className} flex items-center justify-center`}>
        <span className="text-red-500"></span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-gray-200 ${className}`} onClick={onClick}>
      <img
        ref={imgRef}
        src={cdnSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`w-full h-full object-${objectFit} transition-all duration-300 ease-in-out ${
          isLoaded ? 'blur-0 scale-100' : 'blur-sm scale-105'
        }`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        crossOrigin="anonymous"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
      />
    </div>
  );
};

export default LazyImage;