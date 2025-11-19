"use server";

import { adminDb } from "@/utils/firebase/admin";
import type { GalleryDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "galleries";
const MAX_FEATURED = 4;

export async function getGalleries(): Promise<GalleryDocument[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) =>
    serializeGallery(doc.id, doc.data() as GalleryDocument)
  );
}

export async function getGalleryById(
  id: string
): Promise<GalleryDocument | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return serializeGallery(doc.id, doc.data() as GalleryDocument);
}

export async function getGalleryBySlug(
  slug: string
): Promise<GalleryDocument | null> {
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
}

export async function getFeaturedGalleries(
  limit = MAX_FEATURED
): Promise<GalleryDocument[]> {
  try {
    // Try query with orderBy (requires composite index)
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
    // Fallback: query without orderBy and sort in memory
    // This avoids requiring a composite index
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

    // Sort by updatedAt in memory and limit
    return galleries
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
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
