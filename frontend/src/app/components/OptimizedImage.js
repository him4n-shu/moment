"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function OptimizedImage({ src, alt, width, height, className, ...props }) {
  // Check if src is a default path like '/default-avatar.png'
  const isLocalPath = src && typeof src === 'string' && src.startsWith('/') && !src.startsWith('//');
  
  // Initialize with the correct source
  const [imgSrc, setImgSrc] = useState(src);
  const [imgError, setImgError] = useState(false);
  
  // Use regular img tag for local images
  if (isLocalPath) {
    return (
      <img
        src={src}
        alt={alt || ''}
        width={width}
        height={height}
        className={className}
        {...props}
      />
    );
  }
  
  // For remote images, use Next.js Image with error handling
  const handleError = () => {
    console.log('Image failed to load:', src);
    if (!imgError) {
      // Generate a UI avatar as fallback
      const fallbackSrc = `https://ui-avatars.com/api/?name=${alt || 'User'}&background=random&format=png`;
      setImgSrc(fallbackSrc);
      setImgError(true);
    }
  };
  
  return (
    <Image
      src={imgSrc}
      alt={alt || ''}
      width={width || 100}
      height={height || 100}
      className={className}
      onError={handleError}
      {...props}
    />
  );
} 