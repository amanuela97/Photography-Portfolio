import { getGalleries } from "@/utils/data-access/galleries";
import { GalleriesContent } from "./galleries-content";

export const revalidate = 3600;

export const metadata = {
  title: "Galleries | Jitendra Photography",
  description:
    "Explore our collection of wedding, event, and portrait photography galleries",
};

export default async function GalleriesPage() {
  let initialGalleries: Awaited<ReturnType<typeof getGalleries>> = [];

  try {
    initialGalleries = await getGalleries();
  } catch (error) {
    console.error("Error fetching galleries in GalleriesPage:", error);
    // Continue with empty array - page will show empty state
  }

  return (
    <main className="min-h-screen bg-ivory">
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full overflow-hidden pt-[10vh]">
        <div className="absolute inset-0 bg-cover bg-center">
          <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/40" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white mt-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
            My{" "}
            <em className="font-normal text-6xl md:text-7xl text-gold">
              Galleries
            </em>
          </h1>
          <div className="w-24 h-0.5 bg-gold mb-4"></div>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            Explore my collection of beautiful moments captured through the lens
          </p>
        </div>
      </section>

      {/* Galleries Grid with Infinite Scroll */}
      <GalleriesContent initialGalleries={initialGalleries} />
    </main>
  );
}
