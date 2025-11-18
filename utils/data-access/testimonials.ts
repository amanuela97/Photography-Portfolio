"use server";

import { adminDb } from "@/utils/firebase/admin";
import type { TestimonialDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "testimonials";
const MAX_FEATURED = 4;

export async function getTestimonials(): Promise<TestimonialDocument[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) =>
    serializeTestimonial(doc.id, doc.data() as TestimonialDocument)
  );
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
