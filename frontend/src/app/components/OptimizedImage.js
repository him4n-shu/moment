import { useState } from 'react';
import Image from 'next/image';

export default function OptimizedImage({ src, alt, width, height, className, ...props }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgError, setImgError] = useState(false);
  
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