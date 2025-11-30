"use server";

import { unstable_cache } from "next/cache";
import { adminDb, adminStorage } from "@/utils/firebase/admin";
import type { PhotoDocument, CoverPageType } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "photos";
const MAX_FAVORITES = 6;
const CACHE_TTL = 3600;

type FetchOptions = {
  fresh?: boolean;
};

async function fetchPhotosFromDb(): Promise<PhotoDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) =>
      serializePhoto(doc.id, doc.data() as PhotoDocument)
    );
  } catch (error) {
    console.error("Error fetching photos:", error);
    return [];
  }
}

async function fetchFavoritePhotosFromDb(limit = 3): Promise<PhotoDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isFavorite", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) =>
      serializePhoto(doc.id, doc.data() as PhotoDocument)
    );
  } catch (error) {
    console.warn(
      "getFavoritePhotos: Composite index not found, using fallback query",
      error
    );
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isFavorite", "==", true)
      .get();

    const photos = snap.docs.map((doc) =>
      serializePhoto(doc.id, doc.data() as PhotoDocument)
    );

    return photos
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
}

async function fetchCoverPhotoFromDb(
  pageType: CoverPageType
): Promise<PhotoDocument | null> {
  if (pageType === "NONE") {
    return null;
  }

  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isCoverFor", "==", pageType)
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    return serializePhoto(
      snap.docs[0].id,
      snap.docs[0].data() as PhotoDocument
    );
  } catch (error) {
    console.error("Error fetching cover photo:", error);
    return null;
  }
}

const getPhotosCached = unstable_cache(
  fetchPhotosFromDb,
  ["data-access", "photos", "list"],
  { revalidate: CACHE_TTL, tags: ["photos"] }
);

const getFavoritePhotosCached = unstable_cache(
  fetchFavoritePhotosFromDb,
  ["data-access", "photos", "favorites"],
  { revalidate: CACHE_TTL, tags: ["favorite-photos"] }
);

const getCoverPhotoCached = unstable_cache(
  fetchCoverPhotoFromDb,
  ["data-access", "photos", "cover"],
  { revalidate: CACHE_TTL, tags: ["cover-photos"] }
);

export async function getPhotos(
  options?: FetchOptions
): Promise<PhotoDocument[]> {
  return options?.fresh ? fetchPhotosFromDb() : getPhotosCached();
}

export async function getFavoritePhotos(
  limit = 3,
  options?: FetchOptions
): Promise<PhotoDocument[]> {
  return options?.fresh
    ? fetchFavoritePhotosFromDb(limit)
    : getFavoritePhotosCached(limit);
}

export async function getCoverPhoto(
  pageType: CoverPageType,
  options?: FetchOptions
): Promise<PhotoDocument | null> {
  return options?.fresh
    ? fetchCoverPhotoFromDb(pageType)
    : getCoverPhotoCached(pageType);
}

export async function createPhoto(
  payload: Omit<PhotoDocument, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  await enforceFavoriteLimit(payload.isFavorite);
  await enforceCoverPhotoLimit(payload.isCoverFor ?? "NONE", undefined);
  const now = nowISOString();
  await adminDb.collection(COLLECTION).add({
    ...payload,
    isCoverFor: payload.isCoverFor ?? "NONE",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updatePhoto(
  id: string,
  payload: Partial<Omit<PhotoDocument, "id">>
): Promise<void> {
  if (payload.isFavorite !== undefined) {
    await enforceFavoriteLimit(payload.isFavorite, id);
  }
  if (payload.isCoverFor !== undefined) {
    await enforceCoverPhotoLimit(payload.isCoverFor, id);
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

export async function deletePhoto(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

export async function uploadPhotoFile(file: File): Promise<string | null> {
  if (!adminStorage) {
    console.warn("Firebase Storage is not configured.");
    return null;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `photos/${Date.now()}-${file.name}`;
  await adminStorage.file(path).save(buffer, {
    resumable: false,
    metadata: {
      contentType: file.type,
      cacheControl: "public,max-age=31536000",
    },
  });
  const [url] = await adminStorage
    .file(path)
    .getSignedUrl({ action: "read", expires: "2030-01-01" });
  return url;
}

async function enforceFavoriteLimit(
  wantsFavorite: boolean,
  currentId?: string
): Promise<void> {
  if (!wantsFavorite) return;
  const snap = await adminDb
    .collection(COLLECTION)
    .where("isFavorite", "==", true)
    .get();
  const count = snap.docs.filter((doc) => doc.id !== currentId).length;
  if (count >= MAX_FAVORITES) {
    throw new Error(`Only ${MAX_FAVORITES} photos can be marked as favorite.`);
  }
}

async function enforceCoverPhotoLimit(
  pageType: CoverPageType,
  currentId?: string
): Promise<void> {
  // NONE doesn't need enforcement
  if (pageType === "NONE") return;

  // Check if another photo is already set as cover for this page type
  const snap = await adminDb
    .collection(COLLECTION)
    .where("isCoverFor", "==", pageType)
    .get();

  const existing = snap.docs.find((doc) => doc.id !== currentId);
  if (existing) {
    // Clear the existing cover photo for this page type
    await adminDb
      .collection(COLLECTION)
      .doc(existing.id)
      .set({ isCoverFor: "NONE" }, { merge: true });
  }
}

function serializePhoto(id: string, data: PhotoDocument): PhotoDocument {
  return {
    ...data,
    id,
    isCoverFor: data.isCoverFor ?? "NONE",
    createdAt: toISOString(data.createdAt) ?? undefined,
    updatedAt: toISOString(data.updatedAt) ?? undefined,
  };
}
