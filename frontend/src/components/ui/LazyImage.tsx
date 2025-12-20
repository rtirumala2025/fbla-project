/**
 * LazyImage Component
 * Optimized image component with lazy loading and placeholder support
 */
import React, { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  blur?: boolean;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyImage - Loads images only when they enter the viewport
 * 
 * Features:
 * - Intersection Observer for viewport detection
 * - Optional blur placeholder
 * - Error fallback support
 * - Smooth fade-in animation
 */
export const LazyImage = memo(({
  src,
  alt,
  placeholder,
  fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E',
  blur = true,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  style,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentImg = imgRef.current;
    if (currentImg) {
      observer.observe(currentImg);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const displaySrc = hasError ? fallback : (isInView ? src : (placeholder || fallback));

  return (
    <img
      ref={imgRef}
      src={displaySrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} transition-all duration-300 ${
        blur && !isLoaded ? 'blur-sm scale-105' : 'blur-0 scale-100'
      }`}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.5,
      }}
      {...props}
    />
  );
});

LazyImage.displayName = 'LazyImage';

/**
 * Hook for image preloading
 */
export function useImagePreload(src: string): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return isLoaded;
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

export default LazyImage;

