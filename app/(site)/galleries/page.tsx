import { getGalleries } from "@/utils/data-access/galleries";
import { getCoverPhoto } from "@/utils/data-access/photos";
import { GalleriesContent } from "./galleries-content";
import { GalleriesHero } from "./galleries-hero";

export const revalidate = 3600;

export const metadata = {
  title: "Galleries | Jitendra Photography",
  description:
    "Explore our collection of wedding, event, and portrait photography galleries",
};

export default async function GalleriesPage() {
  let initialGalleries: Awaited<ReturnType<typeof getGalleries>> = [];
  let coverPhoto: Awaited<ReturnType<typeof getCoverPhoto>> = null;

  try {
    [initialGalleries, coverPhoto] = await Promise.all([
      getGalleries(),
      getCoverPhoto("GALLERIES"),
    ]);
  } catch (error) {
    console.error("Error fetching galleries in GalleriesPage:", error);
    // Continue with empty array - page will show empty state
  }

  return (
    <main className="min-h-screen bg-ivory">
      <GalleriesHero coverImageUrl={coverPhoto?.url} />
      <GalleriesContent initialGalleries={initialGalleries} />
    </main>
  );
}
