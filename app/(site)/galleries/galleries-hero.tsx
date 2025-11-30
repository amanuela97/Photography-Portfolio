"use client";

import { AnimatedHeroImage } from "../components/animated-hero-image";
import { ScrollTextAnimation } from "../components/scroll-text-animation";

interface GalleriesHeroProps {
  coverImageUrl?: string | null;
}

export function GalleriesHero({ coverImageUrl }: GalleriesHeroProps) {
  const heroImageUrl = coverImageUrl || "/galleries-hero.JPG";

  return (
    <section className="relative h-screen w-full overflow-hidden pt-[10vh]">
      <div className="absolute inset-0 bg-cover bg-center">
        <AnimatedHeroImage
          src={heroImageUrl}
          alt="Galleries hero"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/40" />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-20">
        <ScrollTextAnimation>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
            My{" "}
            <em className="font-normal text-6xl md:text-7xl text-gold">
              Galleries
            </em>
          </h1>
        </ScrollTextAnimation>
        <div className="w-24 h-0.5 bg-gold mb-4"></div>
        <ScrollTextAnimation delay={0.2}>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            Explore my collection of beautiful moments captured through the lens
          </p>
        </ScrollTextAnimation>
      </div>
    </section>
  );
}
