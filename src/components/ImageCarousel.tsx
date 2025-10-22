import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import LazyImage from './LazyImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import { MapPinIcon, TagIcon, ShieldCheckIcon } from './icons';
import { formatPromotion, getPromotionStyles } from '../utils/formatters';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  isSeparado?: boolean;
  garantia?: string;
  sucursal?: string[];
  promociones?: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt, className, isSeparado, garantia, sucursal, promociones }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const constraintsRef = useRef(null);

  const allImages = useMemo(() => {
    // Ensure feature_image is always first if available, then exterior gallery
    const filteredImages = images.filter(Boolean);
    return filteredImages.length > 0 ? filteredImages : [DEFAULT_PLACEHOLDER_IMAGE];
  }, [images]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 50; // pixels to drag to trigger a slide
    const swipePower = 10000; // velocity needed to trigger a slide

    if (offset < -threshold || velocity < -swipePower) {
      // Swiped left
      setCurrentIndex((prev) => Math.min(prev + 1, allImages.length - 1));
    } else if (offset > threshold || velocity > swipePower) {
      // Swiped right
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
    x.set(0); // Snap back to center
  }, [allImages.length, x]);

  const currentImage = allImages[currentIndex];

  return (
    <div ref={constraintsRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <motion.div
        className="flex h-full"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ translateX: `-${currentIndex * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {allImages.map((imgSrc, index) => (
          <div key={index} className="flex-shrink-0 w-full h-full relative">
            <LazyImage
              src={imgSrc}
              alt={`${alt} - ${index + 1}`}
              className={`w-full h-full object-cover ${isSeparado ? 'filter grayscale' : ''}`}
            />

            {/* Top-left tags: Garantia, Sucursal, Promociones - Glassmorphism with text shadows */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[calc(100%-1.5rem)]">
              {garantia && garantia !== 'N/A' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md text-white shadow-2xl border border-white/10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)' }}>
                  <ShieldCheckIcon className="w-4 h-4 drop-shadow-lg" />
                  {garantia}
                </span>
              )}

              {sucursal && sucursal.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md text-white shadow-2xl border border-white/10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)' }}>
                  <MapPinIcon className="w-4 h-4 drop-shadow-lg" />
                  {sucursal[0]}
                </span>
              )}

              {promociones && promociones.length > 0 && promociones.slice(0, 2).map((promo, idx) => {
                const formattedPromo = formatPromotion(promo);
                if (!formattedPromo) return null;

                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/80 to-orange-600/80 backdrop-blur-md text-white shadow-2xl border border-orange-300/20"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)' }}
                  >
                    <TagIcon className="w-4 h-4 drop-shadow-lg" />
                    {formattedPromo}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>

      {allImages.length > 1 && (
        <div className="absolute bottom-3 right-0 flex justify-end gap-1 z-10 pr-4">
          {allImages.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;