import { getPhotos } from "@/utils/data-access/photos";
import { PhotosContent } from "./photo-content";

export const revalidate = 3600;

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
      {/* Header */}
      <div className="text-center h-[80vh] pt-[49vh] bg-linear-to-b from-black/60 to-black/40">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          Photo <span className="font-serif italic text-gold">Portfolio</span>
        </h1>
        <div className="w-24 h-0.5 bg-gold mx-auto mb-6"></div>
        <p className="text-lg text-white max-w-2xl mx-auto">
          A collection of captured moments, emotions, and stories
        </p>
      </div>
      <PhotosContent initialPhotos={initialPhotos} />
    </div>
  );
}
