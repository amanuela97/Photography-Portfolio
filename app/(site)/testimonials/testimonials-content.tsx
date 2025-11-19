"use client";

import Link from "next/link";
import { AnimatedHeroImage } from "../components/animated-hero-image";
import { ScrollTextAnimation } from "../components/scroll-text-animation";
import type { TestimonialDocument } from "@/utils/types";

interface TestimonialsContentProps {
  approvedTestimonials: TestimonialDocument[];
}

export function TestimonialsContent({
  approvedTestimonials,
}: TestimonialsContentProps) {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden pt-[10vh]">
        <div className="absolute inset-0 bg-cover bg-center">
          <AnimatedHeroImage
            src="/testimonials-hero.JPG"
            alt="Client testimonials hero"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/40" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-20">
          <ScrollTextAnimation>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
              Client{" "}
              <em className="font-normal text-6xl md:text-7xl text-gold">
                Testimonials
              </em>
            </h1>
          </ScrollTextAnimation>
          <div className="w-24 h-0.5 bg-gold mb-4"></div>
          <ScrollTextAnimation delay={0.2}>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              Hear from my clients about their photography experience
            </p>
          </ScrollTextAnimation>
        </div>
      </section>

      {/* Add Testimonial Button */}
      <section className="py-12 text-center bg-warm-beige">
        <ScrollTextAnimation>
          <Link
            href="/testimonials/create"
            className="inline-block bg-charcoal text-ivory px-8 py-3 rounded-full font-medium hover:bg-charcoal/90 transition-colors duration-300"
          >
            Share Your Experience
          </Link>
        </ScrollTextAnimation>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        {approvedTestimonials.length > 0 ? (
          <div className="space-y-32">
            {approvedTestimonials.map((testimonial, index) => (
              <ScrollTextAnimation key={testimonial.id} delay={index * 0.1}>
                <div
                  className={`flex flex-col md:flex-row items-start gap-8 md:gap-12 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Testimonial Text */}
                  <div className="flex-1 space-y-4">
                    <p className="text-lg md:text-xl leading-relaxed text-charcoal italic">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <p className="text-base text-warm-gray font-medium">
                      {testimonial.author}
                    </p>
                  </div>
                </div>
              </ScrollTextAnimation>
            ))}
          </div>
        ) : (
          <ScrollTextAnimation>
            <div className="text-center py-20">
              <p className="text-warm-gray text-xl">No testimonials found</p>
            </div>
          </ScrollTextAnimation>
        )}
      </section>
    </div>
  );
}

