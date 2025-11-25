import { NextRequest, NextResponse } from "next/server";
import {
  getStorageLedgerSnapshot,
  reconcileStorageLedger,
  STORAGE_LIMIT_BYTES,
  UPLOAD_OPS_DAILY_LIMIT,
} from "@/utils/storage-ledger";

export async function GET() {
  try {
    const snapshot = await getStorageLedgerSnapshot();
    return NextResponse.json({
      snapshot,
      limits: {
        storageBytes: STORAGE_LIMIT_BYTES,
        uploadOpsDaily: UPLOAD_OPS_DAILY_LIMIT,
      },
    });
  } catch (error) {
    console.error("Failed to fetch storage ledger:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load storage ledger.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    if (action !== "reconcile") {
      return NextResponse.json(
        { error: "Unsupported action." },
        { status: 400 }
      );
    }

    const snapshot = await reconcileStorageLedger();
    return NextResponse.json({
      snapshot,
      limits: {
        storageBytes: STORAGE_LIMIT_BYTES,
        uploadOpsDaily: UPLOAD_OPS_DAILY_LIMIT,
      },
    });
  } catch (error) {
    console.error("Failed to reconcile storage ledger:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reconcile storage usage.",
      },
      { status: 500 }
    );
  }
}
