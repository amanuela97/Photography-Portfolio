import { getGalleries } from "@/utils/data-access/galleries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GalleryGrid } from "./components/gallery-grid";

export default async function GalleryPage() {
  const galleries = await getGalleries();

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-full flex items-center justify-start">
            <Link href="/admin">
              <Button
                variant="outline"
                className="text-brand-text flex items-center gap-2 cursor-pointer hover:bg-brand-accent hover:text-brand-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <h1 className="text-5xl font-bold text-brand-primary text-center">
            Galleries
          </h1>
        </div>

        {/* Gallery Grid */}
        <GalleryGrid galleries={galleries} />
      </div>
    </div>
  );
}
