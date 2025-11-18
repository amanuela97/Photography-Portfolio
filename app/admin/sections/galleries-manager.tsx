import { getGalleries } from "@/utils/data-access/galleries";
import { GalleryCreateForm } from "./gallery-create-form";
import { GalleryList } from "./gallery-list";

export default async function GalleriesManager() {
  const galleries = await getGalleries();
  return (
    <div className="space-y-8">
      <GalleryCreateForm />
      <GalleryList galleries={galleries} />
    </div>
  );
}

