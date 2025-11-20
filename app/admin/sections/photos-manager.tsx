import { getPhotos } from "@/utils/data-access/photos";
import { PhotoUploadForm } from "./photo-upload-form";
import { PhotoGrid } from "./photo-grid";

export default async function PhotosManager() {
  const photos = await getPhotos({ fresh: true });
  return (
    <div className="space-y-8">
      <PhotoUploadForm />
      <PhotoGrid photos={photos} />
    </div>
  );
}
