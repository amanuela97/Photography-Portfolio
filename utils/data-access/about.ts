"use server";

import { unstable_noStore } from "next/cache";
import { adminDb } from "@/utils/firebase/admin";
import type { AboutDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const ABOUT_DOC_PATH = "site/about";

export async function getAbout(): Promise<AboutDocument | null> {
  unstable_noStore();
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

