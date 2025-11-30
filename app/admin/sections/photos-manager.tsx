import { getPhotos } from "@/utils/data-access/photos";
import { PhotoUploadForm } from "./photo-upload-form";
import { PhotoGrid } from "./photo-grid";

export default async function PhotosManager() {
  const photos = await getPhotos({ fresh: true });
  const favoriteCount = photos.filter((p) => p.isFavorite).length;
  return (
    <div className="space-y-8">
      <PhotoUploadForm favoriteCount={favoriteCount} />
      <PhotoGrid photos={photos} />
    </div>
  );
}
