import { getFavoritePhotos } from "@/utils/data-access/photos";
import { getFeaturedGalleries } from "@/utils/data-access/galleries";
import { getFeaturedTestimonials } from "@/utils/data-access/testimonials";
import { HomePageContent } from "./components/home-page-content";

export const revalidate = 3600;

export default async function HomePage() {
  let favoritePhotos: Awaited<ReturnType<typeof getFavoritePhotos>> = [];
  let featuredGalleries: Awaited<ReturnType<typeof getFeaturedGalleries>> = [];
  let featuredTestimonials: Awaited<
    ReturnType<typeof getFeaturedTestimonials>
  > = [];

  try {
    [favoritePhotos, featuredGalleries, featuredTestimonials] =
      await Promise.all([
        getFavoritePhotos(3),
        getFeaturedGalleries(4),
        getFeaturedTestimonials(4),
      ]);
  } catch (error) {
    console.error("Error fetching home page data:", error);
    // Continue with empty data - page will still render with fallbacks
  }

  return (
    <HomePageContent
      favoritePhotos={favoritePhotos}
      featuredGalleries={featuredGalleries}
      featuredTestimonials={featuredTestimonials}
    />
  );
}
