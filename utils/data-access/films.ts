"use server";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/utils/firebase/admin";
import type { FilmDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "films";
const CACHE_TTL = 3600;

type FetchOptions = {
  fresh?: boolean;
};

async function fetchFilmsFromDb(): Promise<FilmDocument[]> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) =>
      serializeFilm(doc.id, doc.data() as FilmDocument)
    );
  } catch (error) {
    console.error("Error fetching films:", error);
    return [];
  }
}

const getFilmsCached = unstable_cache(
  fetchFilmsFromDb,
  ["data-access", "films", "list"],
  { revalidate: CACHE_TTL, tags: ["films"] }
);

export async function getFilms(
  options?: FetchOptions
): Promise<FilmDocument[]> {
  return options?.fresh ? fetchFilmsFromDb() : getFilmsCached();
}

export async function createFilm(
  payload: Omit<FilmDocument, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  const now = nowISOString();
  await adminDb.collection(COLLECTION).add({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateFilm(
  id: string,
  payload: Partial<Omit<FilmDocument, "id">>
): Promise<void> {
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

export async function deleteFilm(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

function serializeFilm(id: string, data: FilmDocument): FilmDocument {
  return {
    ...data,
    id,
    createdAt: toISOString(data.createdAt) ?? undefined,
    updatedAt: toISOString(data.updatedAt) ?? undefined,
  };
}
