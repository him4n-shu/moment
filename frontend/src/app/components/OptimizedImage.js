"use client";
import { useState, useEffect } from 'react';

export default function OptimizedImage({ src, alt, width, height, className, ...props }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(null);

  // Process the image URL to handle various formats
  const processImageUrl = (url) => {
    if (!url) return '/default-avatar.png';
    
    // If it's already a base64 data URL, return as is
    if (typeof url === 'string' && url.startsWith('data:')) {
      return url;
    }
    
    // If it's a local path starting with /, return as is
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    
    // If it's a URL that doesn't start with http, add it
    if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('/')) {
      return `http://${url}`;
    }
    
    return url;
  };

  // Update imgSrc when src prop changes
  useEffect(() => {
    try {
      const processed = processImageUrl(src);
      setImgSrc(processed);
      setIsLoading(true);
      setImgError(false);
      setAspectRatio(null);
    } catch (error) {
      console.error('Error processing image URL:', error);
      setImgSrc('/default-avatar.png');
      setIsLoading(false);
      setImgError(true);
    }
  }, [src]);

  // Handle missing src with a placeholder
  if (!src) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </div>
    );
  }

  // Handle image load to detect aspect ratio
  const handleImageLoad = (e) => {
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setAspectRatio(ratio);
      
      // Add appropriate classes based on aspect ratio
      if (ratio > 1.2) {
        // Landscape image
        img.classList.add('landscape');
        // For very wide images, add extra class
        if (ratio > 2) {
          img.classList.add('very-wide');
        } else if (ratio > 1.5) {
          img.classList.add('moderately-wide');
        }
      } else if (ratio < 0.8) {
        // Portrait image
        img.classList.add('portrait');
        // For very tall images, add extra class
        if (ratio < 0.5) {
          img.classList.add('very-tall');
        } else if (ratio < 0.67) {
          img.classList.add('moderately-tall');
        }
      } else {
        // Square-ish image
        img.classList.add('square');
      }
    }
    
    setIsLoading(false);
  };

  // Use standard img tag for all images for better reliability
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-brand-orange rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt || ''}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={(e) => {
          console.error(`Image failed to load: ${imgSrc?.substring(0, 30)}...`);
          setIsLoading(false);
          setImgError(true);
          
          // Prevent infinite error loop
          e.target.onerror = null;
          
          // Try fallback to UI Avatars for profile images
          if (alt && (alt.includes('profile') || alt.includes('avatar') || alt.includes('user'))) {
            e.target.src = `https://ui-avatars.com/api/?name=${alt || 'User'}&background=random&format=png`;
          } else {
            // For posts and other images, use a generic placeholder
            e.target.src = '/default-avatar.png';
          }
        }}
        {...props}
      />
    </div>
  );
} 