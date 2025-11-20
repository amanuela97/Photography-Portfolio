"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedHeroImage } from "../components/animated-hero-image";
import { AnimatedImage } from "../components/animated-image";
import { ScrollTextAnimation } from "../components/scroll-text-animation";
import type { AboutDocument, PhotoDocument } from "@/utils/types";
import { appendCacheBuster } from "@/utils/cache-buster";

interface AboutPageContentProps {
  about: AboutDocument | null;
  favoritePhotos: PhotoDocument[];
}

export function AboutPageContent({
  about,
  favoritePhotos,
}: AboutPageContentProps) {
  const heroImage = about?.hero.landscapeImage
    ? appendCacheBuster(about.hero.landscapeImage, about?.updatedAt)
    : "/profile-landscape.JPG";
  const heroIntro =
    about?.hero.intro ||
    "Capturing love through art—creating timeless imagery rooted in feeling.";
  const story = about?.story;
  const process = about?.process;
  const gear = about?.gear;

  return (
    <main className="min-h-screen">
      <section className="relative h-screen w-full overflow-hidden">
        <AnimatedHeroImage src={heroImage} alt="Hero landscape" priority />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/30" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-32">
          <ScrollTextAnimation>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Welcome to my{" "}
              <em className="font-normal text-6xl md:text-7xl block">
                Creative World
              </em>
            </h1>
          </ScrollTextAnimation>
          <ScrollTextAnimation delay={0.2}>
            <p className="text-lg leading-relaxed max-w-3xl">{heroIntro}</p>
          </ScrollTextAnimation>
        </div>
      </section>

      {/* Full Story / Bio */}
      {story && (
        <section className="py-32 px-6 bg-brand-surface">
          <div className="max-w-4xl mx-auto">
            <ScrollTextAnimation>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
                My <em className="font-normal text-5xl md:text-6xl">Story</em>
              </h2>
            </ScrollTextAnimation>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-12"></div>

            <div className="w-fit mx-auto space-y-8 text-base md:text-lg text-brand-text leading-relaxed">
              <ScrollTextAnimation delay={0.1}>
                <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-brand-accent first-letter:mr-2 first-letter:float-left">
                  {story.whoIAm}
                </p>
              </ScrollTextAnimation>
              <ScrollTextAnimation delay={0.2}>
                <p>{story.inspiration}</p>
              </ScrollTextAnimation>
              <ScrollTextAnimation delay={0.3}>
                <p>{story.howIStarted}</p>
              </ScrollTextAnimation>
              <ScrollTextAnimation delay={0.4}>
                <p className="italic text-brand-primary font-medium">
                  {story.philosophy}
                </p>
              </ScrollTextAnimation>
            </div>
          </div>
        </section>
      )}

      {/* Behind the Scenes / Process */}
      {process && (
        <section className="py-32 px-6 bg-[#EDE6E3]">
          <div className="max-w-7xl mx-auto">
            <ScrollTextAnimation>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
                How I <em className="font-normal text-5xl md:text-6xl">Work</em>
              </h2>
            </ScrollTextAnimation>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-6"></div>
            <ScrollTextAnimation delay={0.1}>
              <p className="text-center text-brand-muted mb-20 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                {process.intro}
              </p>
            </ScrollTextAnimation>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {process.steps.map((step, index) => (
                <ScrollTextAnimation key={step.number} delay={index * 0.1}>
                  <Card className="p-8 border border-brand-muted/20 bg-brand-surface/50 text-center hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 rounded-2xl">
                    <div className="text-6xl font-bold text-brand-accent mb-6 font-serif">
                      0{step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-4 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-brand-text leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </Card>
                </ScrollTextAnimation>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gear List */}
      {gear && (
        <section className="py-32 px-6 bg-brand-surface">
          <div className="max-w-4xl mx-auto">
            <ScrollTextAnimation>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
                My <em className="font-normal text-5xl md:text-6xl">Gear</em>
              </h2>
            </ScrollTextAnimation>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-6"></div>
            <ScrollTextAnimation delay={0.1}>
              <p className="text-center text-brand-muted mb-16 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                Professional equipment to ensure every moment is captured with
                clarity and artistry.
              </p>
            </ScrollTextAnimation>

            <div className="grid md:grid-cols-3 gap-8">
              <ScrollTextAnimation delay={0.2}>
                <Card className="p-8 border border-brand-muted/20 bg-brand-background rounded-2xl hover:shadow-lg transition-all duration-300">
                  <h3 className="text-xl font-semibold text-brand-primary mb-6 pb-3 border-b border-brand-accent/30">
                    Camera Bodies
                  </h3>
                  <ul className="space-y-3">
                    {gear.camera.map((item) => (
                      <li
                        key={item.name}
                        className="text-brand-text text-sm leading-relaxed"
                      >
                        • {item.name}
                      </li>
                    ))}
                  </ul>
                </Card>
              </ScrollTextAnimation>
              <ScrollTextAnimation delay={0.3}>
                <Card className="p-8 border border-brand-muted/20 bg-brand-background rounded-2xl hover:shadow-lg transition-all duration-300">
                  <h3 className="text-xl font-semibold text-brand-primary mb-6 pb-3 border-b border-brand-accent/30">
                    Lenses
                  </h3>
                  <ul className="space-y-3">
                    {gear.lenses.map((item) => (
                      <li
                        key={item.name}
                        className="text-brand-text text-sm leading-relaxed"
                      >
                        • {item.name}
                      </li>
                    ))}
                  </ul>
                </Card>
              </ScrollTextAnimation>
              <ScrollTextAnimation delay={0.4}>
                <Card className="p-8 border border-brand-muted/20 bg-brand-background rounded-2xl hover:shadow-lg transition-all duration-300">
                  <h3 className="text-xl font-semibold text-brand-primary mb-6 pb-3 border-b border-brand-accent/30">
                    Editing
                  </h3>
                  <ul className="space-y-3">
                    {gear.software.map((item) => (
                      <li
                        key={item.name}
                        className="text-brand-text text-sm leading-relaxed"
                      >
                        • {item.name}
                      </li>
                    ))}
                  </ul>
                </Card>
              </ScrollTextAnimation>
            </div>
          </div>
        </section>
      )}

      {/* Favorite Shots Gallery */}
      {favoritePhotos && favoritePhotos.length > 0 && (
        <section className="py-32 px-6 bg-[#EDE6E3]">
          <div className="max-w-7xl mx-auto">
            <ScrollTextAnimation>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
                <em className="font-normal text-5xl md:text-6xl">Favorite</em>{" "}
                Moments
              </h2>
            </ScrollTextAnimation>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-6"></div>
            <ScrollTextAnimation delay={0.1}>
              <p className="text-center text-brand-muted mb-20 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                A curated collection of images that hold special meaning—each
                one a testament to the beauty of authentic human connection.
              </p>
            </ScrollTextAnimation>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {favoritePhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group"
                >
                  <AnimatedImage
                    src={photo.url || "/placeholder.svg"}
                    alt={`Favorite shot ${index + 1}`}
                    fill
                    unoptimized
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-brand-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA to Contact */}
      <section className="py-32 px-6 bg-brand-surface">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollTextAnimation>
            <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-6 leading-tight">
              Let&apos;s{" "}
              <em className="font-normal text-5xl md:text-6xl">
                Work Together
              </em>
            </h2>
          </ScrollTextAnimation>
          <ScrollTextAnimation delay={0.1}>
            <p className="text-base md:text-lg text-brand-text mb-12 max-w-2xl mx-auto leading-relaxed">
              I&apos;d love to hear about your upcoming event and discuss how we
              can create beautiful memories together.
            </p>
          </ScrollTextAnimation>
          <ScrollTextAnimation delay={0.2}>
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-brand-primary text-brand-contrast hover:text-black transition-all duration-300 px-12 py-6 text-lg rounded-full shadow-lg hover:shadow-xl"
              >
                Get in Touch
              </Button>
            </Link>
          </ScrollTextAnimation>
        </div>
      </section>
    </main>
  );
}
