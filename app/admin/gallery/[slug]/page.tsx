import { getGalleryBySlug } from "@/utils/data-access/galleries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryEditForm } from "./components/gallery-edit-form";
import { ArrowLeft } from "lucide-react";

interface GalleryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GallerySlugPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug, { fresh: true });

  if (!gallery) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-secondary border-b border-border shadow-subtle">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link href="/admin/gallery">
            <Button
              variant="outline"
              className="text-brand-text flex items-center gap-2 cursor-pointer hover:bg-brand-accent hover:text-brand-primary mb-4 -ml-3 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Galleries
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              {gallery.title}
            </h1>
            <p className="text-muted text-sm uppercase tracking-wide">
              Gallery Management
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <GalleryEditForm gallery={gallery} />
      </main>
    </div>
    // </CHANGE>
  );
}
