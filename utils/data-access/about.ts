"use server";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/utils/firebase/admin";
import type { AboutDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const ABOUT_DOC_PATH = "site/about";
const CACHE_TTL = 3600;

type FetchOptions = {
  fresh?: boolean;
};

async function fetchAboutFromDb(): Promise<AboutDocument | null> {
  const snap = await adminDb.doc(ABOUT_DOC_PATH).get();
  if (!snap.exists) {
    return null;
  }
  const data = snap.data() as AboutDocument;
  return {
    ...data,
    updatedAt: toISOString(data.updatedAt) ?? undefined,
  };
}

const getAboutCached = unstable_cache(
  fetchAboutFromDb,
  ["data-access", "about"],
  { revalidate: CACHE_TTL, tags: ["about"] }
);

export async function getAbout(
  options?: FetchOptions
): Promise<AboutDocument | null> {
  return options?.fresh ? fetchAboutFromDb() : getAboutCached();
}

export async function saveAbout(payload: AboutDocument): Promise<void> {
  const now = nowISOString();
  await adminDb.doc(ABOUT_DOC_PATH).set(
    {
      ...payload,
      updatedAt: now,
    },
    { merge: true }
  );
}

