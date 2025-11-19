"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { GalleryDocument } from "@/utils/types";

interface GalleryGridProps {
  galleries: GalleryDocument[];
}

export function GalleryGrid({ galleries: initialGalleries }: GalleryGridProps) {
  const router = useRouter();
  const [galleries, setGalleries] =
    useState<GalleryDocument[]>(initialGalleries);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleDelete = async (gallery: GalleryDocument) => {
    if (
      !confirm(
        `Are you sure you want to delete "${gallery.title}"? This will delete all associated files.`
      )
    ) {
      return;
    }

    try {
      setPendingDelete(gallery.id);
      toast.loading("Deleting gallery and all files...", {
        id: `gallery-delete-${gallery.id}`,
      });

      const formData = new FormData();
      formData.append("id", gallery.id);
      formData.append("slug", gallery.slug);

      const response = await fetch("/api/galleries", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete gallery");
      }

      toast.success(result.message || "Gallery deleted successfully!", {
        id: `gallery-delete-${gallery.id}`,
        duration: 4000,
        position: "top-right",
      });

      // Remove gallery from UI immediately
      setGalleries((prev) => prev.filter((g) => g.id !== gallery.id));
      router.refresh();
    } catch (error) {
      console.error("Gallery delete error:", error);
      toast.error((error as Error).message || "Unable to delete gallery.", {
        id: `gallery-delete-${gallery.id}`,
        duration: 4000,
      });
    } finally {
      setPendingDelete(null);
    }
  };

  if (!galleries.length) {
    return (
      <div className="py-12 text-center text-brand-muted">
        <p>No galleries added yet.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-6xl grid grid-cols-2 gap-8">
        {galleries.map((gallery) => (
          <div
            key={gallery.id}
            className="group relative flex flex-col overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-brand-primary/10">
              <Link
                href={`/admin/gallery/${gallery.slug}`}
                className="block w-full h-full"
              >
                {gallery.coverImageUrl ? (
                  <Image
                    src={gallery.coverImageUrl}
                    alt={gallery.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted">
                    No cover image
                  </div>
                )}
              </Link>
              {/* Delete button overlay */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
                disabled={pendingDelete === gallery.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(gallery);
                }}
              >
                <Trash2 className="h-6 w-6 text-white" />
              </Button>
            </div>

            {/* Title and View More */}
            <div className="pt-4 flex-1 flex flex-col justify-between">
              <Link href={`/admin/gallery/${gallery.slug}`} className="flex-1">
                <h3 className="text-lg font-semibold text-brand-primary hover:text-brand-accent transition-colors mb-2">
                  {gallery.title}
                </h3>
              </Link>
              <Link
                href={`/admin/gallery/${gallery.slug}`}
                className="flex items-center gap-2 text-sm text-brand-accent hover:text-brand-primary transition-colors"
              >
                <span>View more</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
