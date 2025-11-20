"use server";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/utils/firebase/admin";
import type { TestimonialDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "testimonials";
const MAX_FEATURED = 4;
const CACHE_TTL = 3600;

type FetchOptions = {
  fresh?: boolean;
};

async function fetchTestimonialsFromDb(): Promise<TestimonialDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) =>
      serializeTestimonial(doc.id, doc.data() as TestimonialDocument)
    );
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }
}

async function fetchFeaturedTestimonialsFromDb(
  limit = MAX_FEATURED
): Promise<TestimonialDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isFeatured", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) =>
      serializeTestimonial(doc.id, doc.data() as TestimonialDocument)
    );
  } catch (error) {
    console.warn(
      "getFeaturedTestimonials: Composite index not found, using fallback query",
      error
    );
    const snap = await adminDb
      .collection(COLLECTION)
      .where("isFeatured", "==", true)
      .get();

    const testimonials = snap.docs.map((doc) =>
      serializeTestimonial(doc.id, doc.data() as TestimonialDocument)
    );

    return testimonials
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
}

const getTestimonialsCached = unstable_cache(
  fetchTestimonialsFromDb,
  ["data-access", "testimonials", "list"],
  { revalidate: CACHE_TTL, tags: ["testimonials"] }
);

const getFeaturedTestimonialsCached = unstable_cache(
  fetchFeaturedTestimonialsFromDb,
  ["data-access", "testimonials", "featured"],
  { revalidate: CACHE_TTL, tags: ["featured-testimonials"] }
);

export async function getTestimonials(
  options?: FetchOptions
): Promise<TestimonialDocument[]> {
  return options?.fresh ? fetchTestimonialsFromDb() : getTestimonialsCached();
}

export async function getFeaturedTestimonials(
  limit = MAX_FEATURED,
  options?: FetchOptions
): Promise<TestimonialDocument[]> {
  return options?.fresh
    ? fetchFeaturedTestimonialsFromDb(limit)
    : getFeaturedTestimonialsCached(limit);
}

export async function createTestimonial(
  payload: Omit<TestimonialDocument, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  await enforceFeaturedLimit(payload.isFeatured);
  const now = nowISOString();
  await adminDb.collection(COLLECTION).add({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTestimonial(
  id: string,
  payload: Partial<Omit<TestimonialDocument, "id">>
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

export async function deleteTestimonial(id: string): Promise<void> {
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
    throw new Error(`Only ${MAX_FEATURED} testimonials can be featured.`);
  }
}

function serializeTestimonial(
  id: string,
  data: TestimonialDocument
): TestimonialDocument {
  return {
    ...data,
    id,
    createdAt: toISOString(data.createdAt) ?? undefined,
    updatedAt: toISOString(data.updatedAt) ?? undefined,
  };
}
