import { getGalleries } from "@/utils/data-access/galleries";
import { GalleriesContent } from "./galleries-content";
import { GalleriesHero } from "./galleries-hero";

export const dynamic = "force-dynamic";

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
      <GalleriesHero />
      <GalleriesContent initialGalleries={initialGalleries} />
    </main>
  );
}
