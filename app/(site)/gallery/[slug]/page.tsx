import { getGalleryBySlug } from "@/utils/data-access/galleries";
import { notFound } from "next/navigation";
import { GalleryContent } from "./gallery-content";

export const revalidate = 3600;

interface GalleryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  let gallery: Awaited<ReturnType<typeof getGalleryBySlug>> = null;

  try {
    gallery = await getGalleryBySlug(slug);
  } catch (error) {
    console.error(`Error fetching gallery "${slug}":`, error);
    // Will trigger 404 below
  }

  if (!gallery) {
    notFound();
  }

  return <GalleryContent gallery={gallery} />;
}
