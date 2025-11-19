"use client";

import TestimonialForm from "./testimonial-form";
import { AnimatedHeroImage } from "../../components/animated-hero-image";
import { ScrollTextAnimation } from "../../components/scroll-text-animation";

export default function CreateTestimonialPage() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden pt-[10vh]">
        <div className="absolute inset-0 bg-cover bg-center">
          <AnimatedHeroImage
            src="/testimonials-hero.JPG"
            alt="Share your experience"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/40" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-20">
          <ScrollTextAnimation>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
              Share Your{" "}
              <em className="font-normal text-6xl md:text-7xl text-gold">
                Experience
              </em>
            </h1>
          </ScrollTextAnimation>
          <div className="w-24 h-0.5 bg-gold mb-4"></div>
          <ScrollTextAnimation delay={0.2}>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              We&apos;d love to hear about your photography experience with Studio
              of G10
            </p>
          </ScrollTextAnimation>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 px-4 md:px-8 max-w-3xl mx-auto">
        <ScrollTextAnimation>
          <TestimonialForm />
        </ScrollTextAnimation>
      </section>
    </div>
  );
}
