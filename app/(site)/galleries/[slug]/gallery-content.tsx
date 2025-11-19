"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Film } from "lucide-react";
import { AnimatedHeroImage } from "../../components/animated-hero-image";
import { AnimatedImage } from "../../components/animated-image";
import { ScrollTextAnimation } from "../../components/scroll-text-animation";
import type { GalleryDocument } from "@/utils/types";

interface GalleryContentProps {
  gallery: GalleryDocument;
}

export function GalleryContent({ gallery }: GalleryContentProps) {
  return (
    <main className="min-h-screen bg-ivory">
      {/* Hero Section with Cover Image */}
      <section className="relative h-[80vh] w-full overflow-hidden pt-[10vh]">
        <AnimatedHeroImage
          src={gallery.coverImageUrl || "/placeholder.svg"}
          alt={gallery.title}
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/40" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-20">
          <ScrollTextAnimation>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
              {gallery.title}
            </h1>
          </ScrollTextAnimation>
          <div className="w-24 h-0.5 bg-gold mb-4"></div>

          <ScrollTextAnimation delay={0.1}>
            <div className="flex items-center gap-6 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(gallery.createdAt || new Date()).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
              {gallery.video && (
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>Video Included</span>
                </div>
              )}
            </div>
          </ScrollTextAnimation>
        </div>

        {/* Back Button */}
        <Link href="/galleries" className="absolute top-24 left-6 z-60">
          <Button
            variant="ghost"
            className="bg-white/20 cursor-pointer backdrop-blur-sm text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Galleries
          </Button>
        </Link>
      </section>

      {/* Description Section */}
      {gallery.description && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollTextAnimation>
              <p className="text-lg text-charcoal/80 leading-relaxed">
                {gallery.description}
              </p>
            </ScrollTextAnimation>
          </div>
        </section>
      )}

      {/* Video Section */}
      {gallery.video && (
        <section className="py-16 px-6 bg-[#EDE6E3]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <ScrollTextAnimation>
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                  Gallery{" "}
                  <em className="font-normal text-5xl text-gold">Highlight</em>
                </h2>
              </ScrollTextAnimation>
              <div className="w-24 h-0.5 bg-gold mx-auto"></div>
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden shadow-soft">
              <video
                src={gallery.video}
                controls
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>
      )}

      {/* Images Gallery Grid */}
      <section className="py-20 px-6 bg-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <ScrollTextAnimation>
              <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                Gallery{" "}
                <em className="font-normal text-5xl text-gold">Images</em>
              </h2>
            </ScrollTextAnimation>
            <div className="w-24 h-0.5 bg-gold mx-auto mb-6"></div>
            <ScrollTextAnimation delay={0.1}>
              <p className="text-warm-gray">
                {gallery.images.length}{" "}
                {gallery.images.length === 1 ? "photo" : "photos"}
              </p>
            </ScrollTextAnimation>
          </div>

          {/* Masonry-style grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.images.map((image, index) => (
              <div
                key={index}
                className="group relative aspect-3/4 overflow-hidden rounded-lg shadow-subtle hover:shadow-soft transition-all duration-300"
              >
                <AnimatedImage
                  src={image || "/placeholder.svg"}
                  alt={`${gallery.title} - Photo ${index + 1}`}
                  fill
                  className="transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-linear-to-t from-charcoal/60 via-charcoal/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Image Number Overlay */}
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white font-semibold text-sm bg-charcoal/80 px-3 py-1 rounded-full">
                    {index + 1} / {gallery.images.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-[#5A4B43] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollTextAnimation>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Love what you see?
            </h2>
          </ScrollTextAnimation>
          <ScrollTextAnimation delay={0.1}>
            <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
              Let&apos;s create beautiful memories together. Get in touch to
              discuss your photography needs.
            </p>
          </ScrollTextAnimation>
          <ScrollTextAnimation delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/galleries">
                <Button
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-charcoal transition-all duration-300 rounded-full px-10 py-6 text-base"
                >
                  View More Galleries
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-white text-charcoal hover:bg-gold hover:text-charcoal transition-all duration-300 rounded-full px-10 py-6 text-base shadow-soft">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </ScrollTextAnimation>
        </div>
      </section>
    </main>
  );
}
