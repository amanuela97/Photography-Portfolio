import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAbout } from "@/utils/data-access/about";
import { getFavoritePhotos } from "@/utils/data-access/photos";

export const revalidate = 3600;

export default async function AboutPage() {
  let about = null;
  let favoritePhotos: Awaited<ReturnType<typeof getFavoritePhotos>> = [];

  try {
    [about, favoritePhotos] = await Promise.all([
      getAbout(),
      getFavoritePhotos(6),
    ]);
  } catch (error) {
    console.error("Error fetching about page data:", error);
    // Continue with empty data - page will still render with fallbacks
  }

  const heroImage =
    about?.hero.landscapeImage || "/profile-picture-portrait.PNG";
  const heroIntro =
    about?.hero.intro ||
    "Capturing love through art—creating timeless imagery rooted in feeling.";
  const story = about?.story;
  const process = about?.process;
  const gear = about?.gear;

  return (
    <main className="min-h-screen">
      <section className="relative h-screen w-full overflow-hidden">
        <Image
          src={heroImage}
          alt="Hero landscape"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/30" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-32">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Welcome to my{" "}
            <em className="font-normal text-6xl md:text-7xl block">
              Creative World
            </em>
          </h1>
          <p className="text-lg leading-relaxed max-w-3xl">{heroIntro}</p>
        </div>
      </section>

      {/* Full Story / Bio */}
      {story && (
        <section className="py-32 px-6 bg-brand-surface">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
              My <em className="font-normal text-5xl md:text-6xl">Story</em>
            </h2>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-12"></div>

            <div className="w-fit mx-auto space-y-8 text-base md:text-lg text-brand-text leading-relaxed">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-brand-accent first-letter:mr-2 first-letter:float-left">
                {story.whoIAm}
              </p>
              <p>{story.inspiration}</p>
              <p>{story.howIStarted}</p>
              <p className="italic text-brand-primary font-medium">
                {story.philosophy}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Behind the Scenes / Process */}
      {process && (
        <section className="py-32 px-6 bg-[#EDE6E3]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
              How I <em className="font-normal text-5xl md:text-6xl">Work</em>
            </h2>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-6"></div>
            <p className="text-center text-brand-muted mb-20 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {process.intro}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {process.steps.map((step) => (
                <Card
                  key={step.number}
                  className="p-8 border border-brand-muted/20 bg-brand-surface/50 text-center hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 rounded-2xl"
                >
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gear List */}
      {gear && (
        <section className="py-32 px-6 bg-brand-surface">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
              My <em className="font-normal text-5xl md:text-6xl">Gear</em>
            </h2>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-6"></div>
            <p className="text-center text-brand-muted mb-16 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Professional equipment to ensure every moment is captured with
              clarity and artistry.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
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
            </div>
          </div>
        </section>
      )}

      {/* Favorite Shots Gallery */}
      {favoritePhotos && (
        <section className="py-32 px-6  bg-[#EDE6E3]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4 text-center leading-tight">
              <em className="font-normal text-5xl md:text-6xl">Favorite</em>{" "}
              Moments
            </h2>
            <div className="w-16 h-0.5 bg-brand-accent mx-auto mb-6"></div>
            <p className="text-center text-brand-muted mb-20 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              A curated collection of images that hold special meaning—each one
              a testament to the beauty of authentic human connection.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {favoritePhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group"
                >
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={`Favorite shot ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
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
          <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-6 leading-tight">
            Let&apos;s{" "}
            <em className="font-normal text-5xl md:text-6xl">Work Together</em>
          </h2>
          <p className="text-base md:text-lg text-brand-text mb-12 max-w-2xl mx-auto leading-relaxed">
            I&apos;d love to hear about your upcoming event and discuss how we
            can create beautiful memories together.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-brand-primary text-brand-contrast hover:text-black transition-all duration-300 px-12 py-6 text-lg rounded-full shadow-lg hover:shadow-xl"
            >
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
