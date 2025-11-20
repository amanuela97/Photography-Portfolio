"use server";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/utils/firebase/admin";
import type { GalleryDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "galleries";
const MAX_FEATURED = 4;
const CACHE_TTL = 3600;

type FetchOptions = {
  fresh?: boolean;
};

async function fetchGalleriesFromDb(): Promise<GalleryDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) =>
      serializeGallery(doc.id, doc.data() as GalleryDocument)
    );
  } catch (error) {
    console.error("Error fetching galleries:", error);
    return [];
  }
}

async function fetchGalleryByIdFromDb(
  id: string
): Promise<GalleryDocument | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return serializeGallery(doc.id, doc.data() as GalleryDocument);
}

async function fetchGalleryBySlugFromDb(
  slug: string
): Promise<GalleryDocument | null> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) {
      return null;
    }
    const doc = snap.docs[0];
    return serializeGallery(doc.id, doc.data() as GalleryDocument);
  } catch (error) {
    console.error(`Error fetching gallery by slug "${slug}":`, error);
    return null;
  }
}

async function fetchFeaturedGalleriesFromDb(
  limit = MAX_FEATURED
): Promise<GalleryDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isFeatured", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) =>
      serializeGallery(doc.id, doc.data() as GalleryDocument)
    );
  } catch (error) {
    console.warn(
      "getFeaturedGalleries: Composite index not found, using fallback query",
      error
    );
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isFeatured", "==", true)
      .get();

    const galleries = snap.docs.map((doc) =>
      serializeGallery(doc.id, doc.data() as GalleryDocument)
    );

    return galleries
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
}

const getGalleriesCached = unstable_cache(
  fetchGalleriesFromDb,
  ["data-access", "galleries", "list"],
  { revalidate: CACHE_TTL, tags: ["galleries"] }
);

const getGalleryByIdCached = unstable_cache(
  fetchGalleryByIdFromDb,
  ["data-access", "galleries", "by-id"],
  { revalidate: CACHE_TTL, tags: ["galleries"] }
);

const getGalleryBySlugCached = unstable_cache(
  fetchGalleryBySlugFromDb,
  ["data-access", "galleries", "by-slug"],
  { revalidate: CACHE_TTL, tags: ["galleries"] }
);

const getFeaturedGalleriesCached = unstable_cache(
  fetchFeaturedGalleriesFromDb,
  ["data-access", "galleries", "featured"],
  { revalidate: CACHE_TTL, tags: ["featured-galleries"] }
);

export async function getGalleries(
  options?: FetchOptions
): Promise<GalleryDocument[]> {
  return options?.fresh ? fetchGalleriesFromDb() : getGalleriesCached();
}

export async function getGalleryById(
  id: string,
  options?: FetchOptions
): Promise<GalleryDocument | null> {
  return options?.fresh ? fetchGalleryByIdFromDb(id) : getGalleryByIdCached(id);
}

export async function getGalleryBySlug(
  slug: string,
  options?: FetchOptions
): Promise<GalleryDocument | null> {
  return options?.fresh
    ? fetchGalleryBySlugFromDb(slug)
    : getGalleryBySlugCached(slug);
}

export async function getFeaturedGalleries(
  limit = MAX_FEATURED,
  options?: FetchOptions
): Promise<GalleryDocument[]> {
  return options?.fresh
    ? fetchFeaturedGalleriesFromDb(limit)
    : getFeaturedGalleriesCached(limit);
}

export async function createGallery(
  payload: Omit<GalleryDocument, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  await enforceFeaturedLimit(payload.isFeatured);
  const now = nowISOString();
  await adminDb.collection(COLLECTION).add({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateGallery(
  id: string,
  payload: Partial<Omit<GalleryDocument, "id">>
): Promise<void> {
  if (payload.isFeatured !== undefined) {
    await enforceFeaturedLimit(payload.isFeatured, id);
  }
  const now = nowISOString();
  await adminDb
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        ...payload,
        updatedAt: now,
      },
      { merge: true }
    );
}

export async function deleteGallery(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

async function enforceFeaturedLimit(
  wantsFeatured: boolean,
  currentId?: string
): Promise<void> {
  if (!wantsFeatured) return;
  const snap = await adminDb
    .collection(COLLECTION)
    .where("isFeatured", "==", true)
    .get();
  const count = snap.docs.filter((doc) => doc.id !== currentId).length;
  if (count >= MAX_FEATURED) {
    throw new Error(`Only ${MAX_FEATURED} galleries can be featured at once.`);
  }
}

function serializeGallery(id: string, data: GalleryDocument): GalleryDocument {
  return {
    ...data,
    id,
    createdAt: toISOString(data.createdAt) ?? undefined,
    updatedAt: toISOString(data.updatedAt) ?? undefined,
  };
}
