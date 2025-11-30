"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FilmsHero } from "./films-hero";
import { ScrollTextAnimation } from "../components/scroll-text-animation";
import type { FilmDocument } from "@/utils/types";

interface FilmsContentProps {
  initialFilms: FilmDocument[];
  coverImageUrl?: string | null;
}

const FILMS_PER_PAGE = 4;

export function FilmsContent({ initialFilms, coverImageUrl }: FilmsContentProps) {
  const [allFilms] = useState<FilmDocument[]>(initialFilms);
  const [displayedFilms, setDisplayedFilms] = useState<FilmDocument[]>(() =>
    initialFilms.slice(0, FILMS_PER_PAGE)
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialFilms.length > FILMS_PER_PAGE);
  const [selectedFilmIndex, setSelectedFilmIndex] = useState<number | null>(
    null
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load more films (client-side pagination)
  const loadMoreFilms = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simulate slight delay for better UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = nextPage * FILMS_PER_PAGE;
      const endIndex = startIndex + FILMS_PER_PAGE;
      const newFilms = allFilms.slice(startIndex, endIndex);

      if (newFilms.length > 0) {
        setDisplayedFilms((prev) => [...prev, ...newFilms]);
        setPage(nextPage);
        setHasMore(endIndex < allFilms.length);
      } else {
        setHasMore(false);
      }

      setLoading(false);
    }, 300);
  }, [loading, hasMore, page, allFilms]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreFilms();
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
  }, [hasMore, loading, loadMoreFilms]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <FilmsHero coverImageUrl={coverImageUrl} />

      {/* Films Grid Section */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* 2x2 Grid */}
          {displayedFilms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 max-w-6xl mx-auto">
              {displayedFilms.map((film, index) => (
                <ScrollTextAnimation key={film.id} delay={index * 0.1}>
                  <div
                    className="group"
                    onClick={() => setSelectedFilmIndex(index)}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video overflow-hidden mb-4 cursor-pointer group/thumbnail">
                      <video
                        src={film.url}
                        preload="metadata"
                        muted
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/thumbnail:scale-105"
                        playsInline
                      />

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-charcoal/30 group-hover/thumbnail:bg-charcoal/40 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 group-hover/thumbnail:bg-white flex items-center justify-center transition-all duration-300 group-hover/thumbnail:scale-110">
                          <svg
                            className="w-8 h-8 md:w-10 md:h-10 text-charcoal ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-semibold text-charcoal text-center group-hover:text-gold transition-colors duration-300">
                      {film.title}
                    </h3>
                  </div>
                </ScrollTextAnimation>
              ))}
            </div>
          ) : (
            <ScrollTextAnimation>
              <div className="text-center py-20">
                <p className="text-warm-gray text-xl">No films found</p>
              </div>
            </ScrollTextAnimation>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center items-center mt-12">
              <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Intersection observer target */}
          <div ref={observerTarget} className="h-10 mt-8" />

          {/* End message */}
          {!hasMore && displayedFilms.length > 0 && (
            <ScrollTextAnimation>
              <p className="text-center text-warm-gray mt-12 font-serif italic text-lg">
                You&apos;ve seen all the films
              </p>
            </ScrollTextAnimation>
          )}
        </div>
      </section>

      {/* Video Modal */}
      {selectedFilmIndex !== null && displayedFilms[selectedFilmIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 backdrop-blur-sm"
          onClick={() => setSelectedFilmIndex(null)}
        >
          <button
            onClick={() => setSelectedFilmIndex(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            aria-label="Close video"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh] px-4 md:px-16 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full aspect-video">
              <video
                src={displayedFilms[selectedFilmIndex].url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
