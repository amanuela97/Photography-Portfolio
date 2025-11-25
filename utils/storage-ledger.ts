import { adminDb, adminStorage } from "@/utils/firebase/admin";

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const UPLOAD_OPS_DAILY_LIMIT = 20000;
const LEDGER_COLLECTION = "system";
const LEDGER_DOC = "storage-ledger";

export class StorageQuotaError extends Error {
  constructor(
    message: string,
    public readonly code: "storage-limit" | "upload-ops-limit"
  ) {
    super(message);
    this.name = "StorageQuotaError";
  }
}

export interface StorageLedgerSnapshot {
  totalBytes: number;
  totalFiles: number;
  uploadOpsToday: number;
  uploadOpsResetAt: string | null;
  lastUpdatedAt: string;
  lastReconciledAt: string | null;
}

interface NormalizedUploadOps {
  uploadOpsToday: number;
  uploadOpsResetAt: string;
}

const defaultSnapshot = (): StorageLedgerSnapshot => {
  const now = new Date().toISOString();
  return {
    totalBytes: 0,
    totalFiles: 0,
    uploadOpsToday: 0,
    uploadOpsResetAt: now,
    lastUpdatedAt: now,
    lastReconciledAt: null,
  };
};

const ledgerRef = adminDb.collection(LEDGER_COLLECTION).doc(LEDGER_DOC);

function withDefaults(
  data?: FirebaseFirestore.DocumentData
): StorageLedgerSnapshot {
  if (!data) {
    return defaultSnapshot();
  }
  return {
    totalBytes: Number(data.totalBytes ?? 0),
    totalFiles: Number(data.totalFiles ?? 0),
    uploadOpsToday: Number(data.uploadOpsToday ?? 0),
    uploadOpsResetAt: data.uploadOpsResetAt ?? new Date().toISOString(),
    lastUpdatedAt: data.lastUpdatedAt ?? new Date().toISOString(),
    lastReconciledAt: data.lastReconciledAt ?? null,
  };
}

function isSameUTCDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function normalizeUploadOps(
  snapshot: StorageLedgerSnapshot,
  now: Date
): NormalizedUploadOps {
  const resetAt = snapshot.uploadOpsResetAt
    ? new Date(snapshot.uploadOpsResetAt)
    : null;
  const shouldReset = !resetAt || !isSameUTCDate(resetAt, now);
  if (shouldReset) {
    const iso = now.toISOString();
    return { uploadOpsToday: 0, uploadOpsResetAt: iso };
  }
  return {
    uploadOpsToday: snapshot.uploadOpsToday,
    uploadOpsResetAt: snapshot.uploadOpsResetAt ?? now.toISOString(),
  };
}

export async function getStorageLedgerSnapshot(): Promise<StorageLedgerSnapshot> {
  const snap = await ledgerRef.get();
  if (!snap.exists) {
    return reconcileStorageLedger();
  }
  return withDefaults(snap.data());
}

export async function ensureStorageCapacity(
  requiredBytes: number,
  requiredUploads = 1
): Promise<void> {
  const snapshot = await getStorageLedgerSnapshot();
  const now = new Date();
  const { uploadOpsToday } = normalizeUploadOps(snapshot, now);
  if (snapshot.totalBytes + requiredBytes > STORAGE_LIMIT_BYTES) {
    throw new StorageQuotaError(
      "Storage limit reached. Delete existing files before uploading more.",
      "storage-limit"
    );
  }
  if (uploadOpsToday + requiredUploads > UPLOAD_OPS_DAILY_LIMIT) {
    throw new StorageQuotaError(
      "Daily upload operation limit reached. Please wait until tomorrow.",
      "upload-ops-limit"
    );
  }
}

export async function recordSuccessfulUpload(
  bytes: number
): Promise<StorageLedgerSnapshot> {
  const now = new Date();
  const iso = now.toISOString();
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ledgerRef);
    const current = withDefaults(snap.data());
    const { uploadOpsToday, uploadOpsResetAt } = normalizeUploadOps(
      current,
      now
    );
    const updatedBytes = current.totalBytes + bytes;
    if (updatedBytes > STORAGE_LIMIT_BYTES) {
      throw new StorageQuotaError(
        "Storage limit reached while recording upload.",
        "storage-limit"
      );
    }
    if (uploadOpsToday + 1 > UPLOAD_OPS_DAILY_LIMIT) {
      throw new StorageQuotaError(
        "Upload operation limit reached while recording upload.",
        "upload-ops-limit"
      );
    }

    const nextSnapshot: StorageLedgerSnapshot = {
      totalBytes: updatedBytes,
      totalFiles: current.totalFiles + 1,
      uploadOpsToday: uploadOpsToday + 1,
      uploadOpsResetAt,
      lastUpdatedAt: iso,
      lastReconciledAt: current.lastReconciledAt,
    };

    tx.set(ledgerRef, nextSnapshot, { merge: true });
    return nextSnapshot;
  });
}

export async function recordDeletion(
  bytes: number,
  filesDeleted = 1
): Promise<StorageLedgerSnapshot> {
  const now = new Date().toISOString();
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ledgerRef);
    const current = withDefaults(snap.data());
    const nextSnapshot: StorageLedgerSnapshot = {
      ...current,
      totalBytes: Math.max(0, current.totalBytes - bytes),
      totalFiles: Math.max(0, current.totalFiles - filesDeleted),
      lastUpdatedAt: now,
    };
    tx.set(ledgerRef, nextSnapshot, { merge: true });
    return nextSnapshot;
  });
}

export async function reconcileStorageLedger(): Promise<StorageLedgerSnapshot> {
  if (!adminStorage) {
    throw new Error("Firebase Storage bucket is not configured.");
  }

  let nextPageToken: string | undefined;
  let totalBytes = 0;
  let totalFiles = 0;

  do {
    const [files, response] = await adminStorage.getFiles({
      maxResults: 500,
      pageToken: nextPageToken,
    });

    for (const file of files) {
      totalFiles += 1;
      const [metadata] = await file.getMetadata();
      totalBytes += Number(metadata.size ?? 0);
    }

    nextPageToken = response?.pageToken;
  } while (nextPageToken);

  const nowIso = new Date().toISOString();
  const updatedSnapshot: StorageLedgerSnapshot = {
    totalBytes,
    totalFiles,
    uploadOpsToday: 0,
    uploadOpsResetAt: nowIso,
    lastUpdatedAt: nowIso,
    lastReconciledAt: nowIso,
  };

  await ledgerRef.set(updatedSnapshot, { merge: true });
  return updatedSnapshot;
}

export {
  STORAGE_LIMIT_BYTES,
  UPLOAD_OPS_DAILY_LIMIT,
  LEDGER_DOC,
  LEDGER_COLLECTION,
};
