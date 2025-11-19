import { Timestamp } from "firebase-admin/firestore";
import type { TimestampLike } from "@/utils/types";

export function extractExtension(name: string): string {
  const match = name.match(/\.[^/.]+$/);
  return match ? match[0] : "";
}

export function toISOString(value: TimestampLike): string | undefined {
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "object" && "toDate" in value) {
    return value.toDate().toISOString();
  }
  return undefined;
}

export function nowISOString(): string {
  return new Date().toISOString();
}

export function parseJsonField<T>(value: FormDataEntryValue | null): T | null {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Failed to parse JSON field:", error);
    return null;
  }
}
