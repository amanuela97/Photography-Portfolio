"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface AnimatedHeroImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function AnimatedHeroImage({
  src,
  alt,
  priority = false,
  className = "",
}: AnimatedHeroImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth fade-in
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-1000 ease-in-out ${
          isLoaded && isVisible ? "opacity-100" : "opacity-0"
        }`}
        priority={priority}
        unoptimized
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
