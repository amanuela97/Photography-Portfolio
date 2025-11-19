"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  GalleryDocument,
  PhotoDocument,
  TestimonialDocument,
} from "@/utils/types";
import { useSiteProfile } from "./site-profile-context";

interface HomePageContentProps {
  featuredGalleries: GalleryDocument[];
  favoritePhotos: PhotoDocument[];
  featuredTestimonials: TestimonialDocument[];
}

export function HomePageContent({
  featuredGalleries,
  favoritePhotos,
  featuredTestimonials,
}: HomePageContentProps) {
  const profile = useSiteProfile();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % favoritePhotos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [favoritePhotos.length]);

  const locationCopy = profile?.location ?? "Worldwide";
  const bioCopy =
    profile?.bio ??
    "Capturing love through art. Celebrating moments as they unfold organically.";

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {favoritePhotos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={photo.url}
              alt={photo.title}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/40 to-black/20" />
          </div>
        ))}

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-32">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 text-balance leading-tight">
            Capturing
            <em className="font-normal text-4xl md:text-6xl block md:inline">
              {"  "}
              Moments
            </em>
            That Matter
          </h1>
          <p className="text-lg md:text-xl mt-4 text-white/90">
            Based in {locationCopy} | Travels Worldwide
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {favoritePhotos.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-8" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      {bioCopy && (
        <section className="py-32 px-6 bg-ivory">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6 leading-tight">
                  Unveiling{" "}
                  <em className="font-normal text-6xl md:text-7xl text-gold">
                    Stories
                  </em>
                  <br />
                  Through Photography & Film
                </h2>

                <p className="text-lg text-charcoal/80 leading-relaxed">
                  {bioCopy}
                </p>
                <Link href="/about">
                  <Button className="mt-8 bg-charcoal text-ivory hover:bg-gold hover:text-charcoal transition-all duration-300 rounded-full px-8 py-6 text-base shadow-soft">
                    Read Full Story
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="picture-frame border-4 border-gold rounded-lg bg-[url('/ornate-pattern.png')] bg-repeat">
                  <div className="relative h-[550px] rounded-sm overflow-hidden">
                    <Image
                      src="/profile-portrait.PNG"
                      alt="Jitendra - Photographer"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Work Section */}
      {featuredGalleries.length > 0 && (
        <section className="py-32 px-6 bg-[#EDE6E3]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-4 leading-tight">
                My{" "}
                <em className="font-normal text-6xl md:text-7xl text-gold">
                  work
                </em>
              </h2>
              <div className="w-24 h-0.5 bg-gold mx-auto mb-6"></div>
              <p className="text-lg text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
                Celebrating moments as they unfold organically, transforming
                your milestones into visual treasures that tell your unique
                story.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredGalleries.map((gallery) => (
                <Card
                  key={gallery.title}
                  className="overflow-hidden border-none bg-white shadow-subtle hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-80 overflow-hidden group">
                    <Image
                      src={gallery.coverImageUrl || "/placeholder.svg"}
                      alt={gallery.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-charcoal/60 via-charcoal/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6 text-center space-y-3 bg-white">
                    <h3 className="text-xl font-semibold text-charcoal line-clamp-1">
                      {gallery.title}
                    </h3>
                    <Link
                      href={`/galleries/${gallery.slug}`}
                      className="inline-block text-gold hover:text-charcoal transition-colors duration-300 underline decoration-gold hover:decoration-charcoal underline-offset-4 text-sm font-medium"
                    >
                      view more
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {featuredTestimonials.length > 0 && (
        <section className="py-32 px-6 bg-[#5A4B43] text-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Happy{" "}
                <em className="font-normal text-6xl md:text-7xl text-gold">
                  Words
                </em>{" "}
                from happy{" "}
                <em className="font-normal text-6xl md:text-7xl text-gold">
                  clients
                </em>
              </h2>
              <div className="w-24 h-0.5 bg-gold mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 mt-16 max-w-5xl mx-auto">
              {featuredTestimonials.map(
                (testimonial: TestimonialDocument, index: number) => (
                  <div
                    key={index}
                    className={`${
                      index % 2 === 0 ? "text-left" : "text-right"
                    } space-y-4`}
                  >
                    <p className="text-lg italic leading-relaxed text-white/90">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <p className="text-sm font-semibold text-gold uppercase tracking-wider">
                      — {testimonial.author}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="text-center mt-16">
              <Link href="/testimonials">
                <Button
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-charcoal transition-all duration-300 rounded-full px-8 py-6 text-base"
                >
                  Read More Testimonials
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-32 px-6 bg-ivory">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6 leading-tight">
            Ready to capture{" "}
            <em className="font-normal text-6xl md:text-7xl text-gold">
              your story?
            </em>
          </h2>
          <div className="w-24 h-0.5 bg-gold mx-auto mb-8"></div>
          <p className="text-lg text-charcoal/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Let&apos;s create timeless memories together. Whether it&apos;s your
            wedding day, a milestone celebration, or a special moment you want
            to preserve forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/galleries">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-charcoal text-charcoal bg-transparent hover:bg-charcoal hover:text-ivory transition-all duration-300 rounded-full px-10 py-6 text-base"
              >
                View Work
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-charcoal text-ivory hover:bg-gold hover:text-charcoal transition-all duration-300 rounded-full px-10 py-6 text-base shadow-soft"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
