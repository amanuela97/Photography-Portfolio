import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteData } from "@/utils/data";

const favoriteShots = [
  "/intimate-wedding-couple-moment-close-up.jpg",
  "/candid-laughter-during-wedding-reception.jpg",
  "/emotional-first-dance-wedding-photo.jpg",
  "/beautiful-wedding-ring-detail-shot.jpg",
  "/bride-getting-ready.png",
  "/golden-hour-couple-portrait-outdoors.jpg",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* About Hero */}
      <section className="relative h-screen w-full overflow-hidden">
        <Image
          src="/profile-picture-portrait.PNG"
          alt="Jitendra"
          fill
          className="object-cover"
          priority
          unoptimized
          onError={(e) => {
            console.error("Failed to load photographer portrait");
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 to-black/30" />

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-32">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome, I&apos;m{" "}
            <em className="font-normal text-6xl md:text-7xl">
              {siteData.photographer.name}
            </em>
          </h1>
          <p className="text-xl font-medium mb-6">
            {siteData.photographer.title}
          </p>
          <p className="text-lg leading-relaxed max-w-2xl">
            {siteData.about.story.whoIAm}
          </p>
        </div>
      </section>

      {/* Full Story / Bio */}
      <section className="py-24 px-6 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-8 text-center">
            My <em className="font-normal text-5xl md:text-6xl">Story</em>
          </h2>

          <div className="space-y-6 text-lg text-foreground leading-relaxed">
            <p>{siteData.about.story.whoIAm}</p>
            <p>{siteData.about.story.inspiration}</p>
            <p>{siteData.about.story.howIStarted}</p>
            <p>{siteData.about.story.philosophy}</p>
          </div>
        </div>
      </section>

      {/* Behind the Scenes / Process */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-center">
            How I <em className="font-normal text-5xl md:text-6xl">Work</em>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            {siteData.process.intro}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {siteData.process.steps.map((step) => (
              <Card
                key={step.number}
                className="p-8 border-border text-center hover:shadow-soft transition-shadow"
              >
                <div className="text-5xl font-bold text-accent mb-4">
                  0{step.number}
                </div>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  {step.title}
                </h3>
                <p className="text-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gear List */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-center">
            My <em className="font-normal text-5xl md:text-6xl">Gear</em>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Professional equipment to ensure every moment is captured with
            clarity and artistry.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-border">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Camera Bodies
              </h3>
              <ul className="space-y-2">
                {siteData.gear.camera.map((item) => (
                  <li key={item.name} className="text-foreground">
                    • {item.name}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 border-border">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Lenses
              </h3>
              <ul className="space-y-2">
                {siteData.gear.lenses.map((item) => (
                  <li key={item.name} className="text-foreground">
                    • {item.name}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 border-border">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Editing
              </h3>
              <ul className="space-y-2">
                {siteData.gear.software.map((item) => (
                  <li key={item.name} className="text-foreground">
                    • {item.name}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Favorite Shots Gallery */}
      <section className="py-24 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-center">
            <em className="font-normal text-5xl md:text-6xl">Favorite</em>{" "}
            Moments
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            A curated collection of images that hold special meaning—each one a
            testament to the beauty of authentic human connection.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favoriteShots.map((shot, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden shadow-subtle hover:shadow-soft transition-shadow"
              >
                <Image
                  src={shot || "/profile-picture-portrait.PNG"}
                  alt={`Favorite shot ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    console.error(`Failed to load favorite shot: ${shot}`);
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA to Contact */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Let&apos;s{" "}
            <em className="font-normal text-5xl md:text-6xl">Work Together</em>
          </h2>
          <p className="text-lg text-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            I&apos;d love to hear about your upcoming event and discuss how we
            can create beautiful memories together.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

