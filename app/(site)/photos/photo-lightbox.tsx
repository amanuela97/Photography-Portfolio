"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  alt: string;
}

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const currentPhoto = photos[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handlePrevious = () => {
    if (!isFirst) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50 text-white font-medium">
        <span className="text-lg">{currentIndex + 1}</span>
        <span className="text-white/60"> / {photos.length}</span>
      </div>

      {/* Previous button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        disabled={isFirst}
        className="absolute left-2 md:left-8 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white"
        aria-label="Previous photo"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Next button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={isLast}
        className="absolute right-2 md:right-8 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white"
        aria-label="Next photo"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Image container */}
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] px-16 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full">
          <Image
            src={currentPhoto.url || "/placeholder.svg"}
            alt={currentPhoto.alt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm hidden md:block">
        Use arrow keys to navigate • Press ESC to close
      </div>
    </div>
  );
}
