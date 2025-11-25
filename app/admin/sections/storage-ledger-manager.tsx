import {
  getStorageLedgerSnapshot,
  STORAGE_LIMIT_BYTES,
  UPLOAD_OPS_DAILY_LIMIT,
} from "@/utils/storage-ledger";
import { StorageLedgerPanel } from "../components/storage-ledger-panel";

export default async function StorageLedgerManager() {
  const snapshot = await getStorageLedgerSnapshot();
  return (
    <StorageLedgerPanel
      initialSnapshot={snapshot}
      limits={{
        storageBytes: STORAGE_LIMIT_BYTES,
        uploadOpsDaily: UPLOAD_OPS_DAILY_LIMIT,
      }}
    />
  );
}
