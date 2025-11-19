import { getAbout } from "@/utils/data-access/about";
import { getFavoritePhotos } from "@/utils/data-access/photos";
import { AboutPageContent } from "./about-content";

export const dynamic = "force-dynamic";

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

  return <AboutPageContent about={about} favoritePhotos={favoritePhotos} />;
}
