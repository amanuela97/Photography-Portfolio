"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { PhotoLightbox } from "./photo-lightbox";
import type { PhotoDocument } from "@/utils/types";

interface PhotosContentProps {
  initialPhotos: PhotoDocument[];
}

// Varying heights for natural masonry layout
const PHOTO_HEIGHTS = [600, 700, 800, 750, 650, 720, 680, 770];
const PHOTOS_PER_PAGE = 8;

export function PhotosContent({ initialPhotos }: PhotosContentProps) {
  const [allPhotos] = useState<PhotoDocument[]>(initialPhotos);
  const [displayedPhotos, setDisplayedPhotos] = useState<PhotoDocument[]>(() =>
    initialPhotos.slice(0, PHOTOS_PER_PAGE)
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialPhotos.length > PHOTOS_PER_PAGE
  );
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load more photos (client-side pagination)
  const loadMorePhotos = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simulate slight delay for better UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = nextPage * PHOTOS_PER_PAGE;
      const endIndex = startIndex + PHOTOS_PER_PAGE;
      const newPhotos = allPhotos.slice(startIndex, endIndex);

      if (newPhotos.length > 0) {
        setDisplayedPhotos((prev) => [...prev, ...newPhotos]);
        setPage(nextPage);
        setHasMore(endIndex < allPhotos.length);
      } else {
        setHasMore(false);
      }

      setLoading(false);
    }, 300);
  }, [loading, hasMore, page, allPhotos]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePhotos();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMorePhotos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) =>
          prev === null ? null : Math.max(0, prev - 1)
        );
      } else if (e.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) =>
          prev === null ? null : Math.min(displayedPhotos.length - 1, prev + 1)
        );
      } else if (e.key === "Escape") {
        setSelectedPhotoIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, displayedPhotos.length]);

  return (
    <>
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* 2x2 Photo Grid with natural heights */}
        {displayedPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 max-w-6xl mx-auto">
            {displayedPhotos.map((photo, index) => {
              const height = PHOTO_HEIGHTS[index % PHOTO_HEIGHTS.length];
              return (
                <div
                  key={photo.id}
                  className="relative overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.title || `Photo ${index + 1}`}
                    width={600}
                    height={height}
                    className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors duration-300" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-warm-gray text-xl">No photos found</p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center mt-8">
            <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerTarget} className="h-10 mt-8" />

        {/* End message */}
        {!hasMore && (
          <p className="text-center text-warm-gray mt-8 font-serif italic">
            You&apos;ve reached the end of the collection
          </p>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          photos={displayedPhotos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            alt: photo.title || "Photo",
          }))}
          currentIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={setSelectedPhotoIndex}
        />
      )}
    </>
  );
}
