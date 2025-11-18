"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { featuredGalleries, testimonials, siteData } from "@/utils/data";

const heroImages = [
  "/romantic-wedding-couple-embracing-at-sunset-by-lak.jpg",
  "/bride-and-groom-dancing-under-fairy-lights.jpg",
  "/couple-walking-hand-in-hand-through-autumn-forest.jpg",
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroImages.length) % heroImages.length
    );
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section with Slider */}
      <section className="relative h-screen w-full overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt="Hero"
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
              onError={(e) => {
                console.error(`Failed to load image: ${image}`);
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/40 to-black/20" />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-32">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 text-balance leading-7">
            Capturing
            <em className="font-normal text-7xl md:text-8xl">Moments</em>
            That Matter
          </h1>
          <p className="text-lg md:text-xl mt-4 text-white/90">
            Based in {siteData.location} | Travels Worldwide
          </p>
        </div>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-8" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* About Snippet */}
      <section className="py-24 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                Unveiling{" "}
                <em className="font-normal text-5xl md:text-6xl">Stories</em>
                <br />
                Through Photography & Film
              </h2>
              <p className="text-lg text-foreground leading-relaxed mt-6">
                {siteData.description}
              </p>
              <p className="text-lg text-foreground leading-relaxed mt-4">
                {siteData.photographer.shortBio}
              </p>
              <Link href="/about">
                <Button className="mt-8 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                  Read Full Story
                </Button>
              </Link>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-soft">
              <Image
                src="/profile-picture-landscape.JPG"
                alt="Jitendra - Photographer"
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  console.error("Failed to load photographer image");
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Gallery Preview */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary text-center mb-4">
            My <em className="font-normal text-5xl md:text-6xl">work</em>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Capturing love through art. Celebrating moments as they unfold
            organically, transforming your milestones into visual treasures that
            tell your unique story.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredGalleries.map((gallery) => (
              <Card
                key={gallery.title}
                className="overflow-hidden border-border hover:shadow-soft transition-shadow"
              >
                <div className="relative h-80">
                  <Image
                    src={gallery.image}
                    alt={gallery.title}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error(
                        `Failed to load gallery image: ${gallery.image}`
                      );
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                    {gallery.eventType}
                  </p>
                  <h3 className="text-xl font-semibold text-primary mb-3">
                    {gallery.title}
                  </h3>
                  <Link
                    href={gallery.href}
                    className="text-accent hover:text-primary transition-colors underline text-sm font-medium"
                  >
                    view more
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-24 px-6 bg-[#5A4B43] text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Happy <em className="font-normal text-5xl md:text-6xl">Words</em>{" "}
            from happy{" "}
            <em className="font-normal text-5xl md:text-6xl">clients</em>
          </h2>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 mt-16 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={index % 2 === 0 ? "text-left" : "text-right"}
              >
                <p className="text-lg italic leading-relaxed mb-4">
                  &quot;{testimonial.quote}&quot;
                </p>
                <p className="text-sm font-semibold text-accent">
                  — {testimonial.author}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/testimonials">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary"
              >
                Read More Testimonials
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 bg-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Ready to capture{" "}
            <em className="font-normal text-5xl md:text-6xl">your story?</em>
          </h2>
          <p className="text-lg text-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Let&apos;s create timeless memories together. Whether it&apos;s your
            wedding day, a milestone celebration, or a special moment you want
            to preserve forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/galleries">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                View Work
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
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
