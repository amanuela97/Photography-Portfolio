"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryDocument } from "@/utils/types";

interface GalleriesContentProps {
  initialGalleries: GalleryDocument[];
}

export function GalleriesContent({ initialGalleries }: GalleriesContentProps) {
  const [galleries] = useState<GalleryDocument[]>(initialGalleries);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Simulate loading more galleries (in production, this would be an API call)
  const loadMoreGalleries = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo: stop after 2 pages
    if (page >= 2) {
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    // In production, fetch from API: const newGalleries = await fetch(`/api/galleries?page=${page + 1}`);
    setPage((prev) => prev + 1);
    setIsLoading(false);
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadMoreGalleries();
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
  }, [hasMore, isLoading]);

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Galleries Grid - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {galleries.map((gallery) => (
            <div key={gallery.id} className="group">
              {/* Image */}
              <Link href={`/gallery/${gallery.slug}`}>
                <div className="relative aspect-4/3 overflow-hidden rounded-lg mb-4 bg-warm-gray">
                  <Image
                    src={gallery.coverImageUrl || "/placeholder.svg"}
                    alt={gallery.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-charcoal/40 via-charcoal/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-charcoal mb-3 group-hover:text-gold transition-colors duration-300">
                {gallery.title}
              </h3>

              {/* View Now Link */}
              <Link
                href={`/gallery/${gallery.slug}`}
                className="inline-flex items-center text-gold hover:text-charcoal transition-colors duration-300 font-medium text-sm uppercase tracking-wider"
              >
                View Now
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        )}

        {/* Intersection Observer Target */}
        <div ref={observerTarget} className="h-4" />

        {/* End Message */}
        {!hasMore && galleries.length > 0 && (
          <div className="text-center py-12">
            <p className="text-warm-gray text-lg">
              You&apos;ve reached the end of my galleries
            </p>
          </div>
        )}

        {/* Empty State */}
        {galleries.length === 0 && (
          <div className="text-center py-20">
            <p className="text-warm-gray text-xl">No galleries found</p>
          </div>
        )}
      </div>
    </section>
  );
}
