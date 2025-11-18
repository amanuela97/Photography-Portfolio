"use server";

import { adminDb } from "@/utils/firebase/admin";
import type { FilmDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const COLLECTION = "films";

export async function getFilms(): Promise<FilmDocument[]> {
  const snap = await adminDb.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => serializeFilm(doc.id, doc.data() as FilmDocument));
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
  await adminDb.collection(COLLECTION).doc(id).set(
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

