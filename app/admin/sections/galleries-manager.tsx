import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryCreateForm } from "./gallery-create-form";

export default async function GalleriesManager() {
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Link href="/admin/gallery">
          <Button
            variant="outline"
            className=" text-brand-contrast cursor-pointer"
          >
            Manage Galleries
          </Button>
        </Link>
      </div>
      <GalleryCreateForm />
    </div>
  );
}
