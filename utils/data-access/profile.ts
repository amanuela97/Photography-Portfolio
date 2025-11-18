"use server";

import { adminDb } from "@/utils/firebase/admin";
import type { ProfileDocument } from "@/utils/types";
import { nowISOString, toISOString } from "./helpers";

const PROFILE_DOC_PATH = "site/profile";

export async function getProfile(): Promise<ProfileDocument | null> {
  const snap = await adminDb.doc(PROFILE_DOC_PATH).get();
  if (!snap.exists) {
    return null;
  }
  const data = snap.data() as ProfileDocument;
  return {
    ...data,
    createdAt: toISOString(data.createdAt) ?? undefined,
    updatedAt: toISOString(data.updatedAt) ?? undefined,
  };
}

export async function saveProfile(
  payload: Omit<ProfileDocument, "createdAt" | "updatedAt">
): Promise<void> {
  const existing = await getProfile();
  const now = nowISOString();

  await adminDb.doc(PROFILE_DOC_PATH).set(
    {
      ...payload,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    { merge: true }
  );
}
