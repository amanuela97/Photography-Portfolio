import { getPhotos, getCoverPhoto } from "@/utils/data-access/photos";
import { PhotosContent } from "./photo-content";
import { PhotosHero } from "./photos-hero";

export const revalidate = 3600;

export default async function PhotosPage() {
  let initialPhotos: Awaited<ReturnType<typeof getPhotos>> = [];
  let coverPhoto: Awaited<ReturnType<typeof getCoverPhoto>> = null;

  try {
    [initialPhotos, coverPhoto] = await Promise.all([
      getPhotos(),
      getCoverPhoto("PHOTOS"),
    ]);
  } catch (error) {
    console.error("Error fetching photos in PhotosPage:", error);
    // Continue with empty array - page will show empty state
  }

  return (
    <div className="min-h-screen bg-ivory">
      <PhotosHero coverImageUrl={coverPhoto?.url} />
      <PhotosContent initialPhotos={initialPhotos} />
    </div>
  );
}
