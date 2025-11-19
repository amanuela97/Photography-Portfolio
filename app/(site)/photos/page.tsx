import { getPhotos } from "@/utils/data-access/photos";
import { PhotosContent } from "./photo-content";
import { PhotosHero } from "./photos-hero";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  let initialPhotos: Awaited<ReturnType<typeof getPhotos>> = [];

  try {
    initialPhotos = await getPhotos();
  } catch (error) {
    console.error("Error fetching photos in PhotosPage:", error);
    // Continue with empty array - page will show empty state
  }

  return (
    <div className="min-h-screen bg-ivory">
      <PhotosHero />
      <PhotosContent initialPhotos={initialPhotos} />
    </div>
  );
}
