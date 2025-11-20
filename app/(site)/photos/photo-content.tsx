"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatedImage } from "../components/animated-image";
import { ScrollTextAnimation } from "../components/scroll-text-animation";
import { PhotoLightbox } from "./photo-lightbox";
import type { PhotoDocument, EventType } from "@/utils/types";

interface PhotosContentProps {
  initialPhotos: PhotoDocument[];
}

// Varying heights for natural masonry layout
const PHOTO_HEIGHTS = [600, 700, 800, 750, 650, 720, 680, 770];
const PHOTOS_PER_PAGE = 8;
const EVENT_TYPES: Array<"All" | EventType> = [
  "All",
  "Wedding",
  "Birthday",
  "Baby Showers",
  "Elopement",
  "Birthdays",
  "Ceremonies",
  "Anniversaries",
  "Engagements",
  "Graduation",
  "Other",
];

export function PhotosContent({ initialPhotos }: PhotosContentProps) {
  const [allPhotos] = useState<PhotoDocument[]>(initialPhotos);
  const [selectedEvent, setSelectedEvent] = useState<"All" | EventType>("All");
  const filteredPhotos = useMemo(() => {
    if (selectedEvent === "All") {
      return allPhotos;
    }
    return allPhotos.filter((photo) => photo.eventType === selectedEvent);
  }, [allPhotos, selectedEvent]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load more photos (client-side pagination)
  const displayedPhotos = useMemo(
    () => filteredPhotos.slice(0, page * PHOTOS_PER_PAGE),
    [filteredPhotos, page]
  );
  const hasMore = displayedPhotos.length < filteredPhotos.length;

  const loadMorePhotos = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    setTimeout(() => {
      setPage((prev) => prev + 1);
      setLoading(false);
    }, 300);
  }, [loading, hasMore]);

  const handleFilterChange = (type: "All" | EventType) => {
    setSelectedEvent(type);
    setPage(1);
  };

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
        <ScrollTextAnimation>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {EVENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFilterChange(type)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                  selectedEvent === type
                    ? "bg-charcoal text-ivory border-charcoal"
                    : "border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-ivory"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </ScrollTextAnimation>

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
                  <AnimatedImage
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.title || `Photo ${index + 1}`}
                    width={600}
                    height={height}
                    className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    unoptimized
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors duration-300" />
                </div>
              );
            })}
          </div>
        ) : (
          <ScrollTextAnimation>
            <div className="text-center py-20">
              <p className="text-warm-gray text-xl">No photos found</p>
            </div>
          </ScrollTextAnimation>
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
          <ScrollTextAnimation>
            <p className="text-center text-warm-gray mt-8 font-serif italic">
              You&apos;ve reached the end of the collection
            </p>
          </ScrollTextAnimation>
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
