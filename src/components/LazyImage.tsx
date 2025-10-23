import React, { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  onClick?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  objectFit = 'cover',
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof src !== 'string' || src.trim() === '') {
      console.error('❌ LazyImage: src prop is missing or invalid.', { alt, src });
      setHasError(true);
      return;
    }

    // Handle cached images - check if image is already complete
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [src, alt]);

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
        src={src}
        alt={alt}
        className={`w-full h-full object-${objectFit} transition-all duration-500 ease-in-out ${
          isLoaded ? 'blur-0 scale-100' : 'blur-lg scale-110'
        }`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
      />
    </div>
  );
};

export default LazyImage;