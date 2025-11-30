"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiUrl } from "@/utils/api-url";

interface StorageLedgerSnapshot {
  totalBytes: number;
  totalFiles: number;
  uploadOpsToday: number;
  uploadOpsResetAt: string | null;
  lastUpdatedAt: string;
  lastReconciledAt: string | null;
}

interface StorageLedgerPanelProps {
  initialSnapshot: StorageLedgerSnapshot;
  limits: {
    storageBytes: number;
    uploadOpsDaily: number;
  };
}

const BYTES_IN_GB = 1024 * 1024 * 1024;
const POLL_INTERVAL_MS = 60_000;

export function StorageLedgerPanel({
  initialSnapshot,
  limits,
}: StorageLedgerPanelProps) {
  const [snapshot, setSnapshot] =
    useState<StorageLedgerSnapshot>(initialSnapshot);
  const [isRefreshing, startRefresh] = useTransition();
  const [isReconciling, startReconcile] = useTransition();

  const fetchSnapshot = useCallback(async () => {
    const response = await fetch(getApiUrl("api/storage-ledger"), {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch storage ledger snapshot.");
    }
    const payload = await response.json();
    setSnapshot(payload.snapshot);
    return payload.snapshot as StorageLedgerSnapshot;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      fetchSnapshot().catch((error) => {
        console.error(error);
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchSnapshot]);

  const storagePercent = Math.min(
    100,
    (snapshot.totalBytes / limits.storageBytes) * 100
  );
  const uploadOpsPercent = Math.min(
    100,
    (snapshot.uploadOpsToday / limits.uploadOpsDaily) * 100
  );

  const formattedStats = useMemo(
    () => [
      {
        label: "Storage Used",
        value: `${formatGB(snapshot.totalBytes)} / ${formatGB(
          limits.storageBytes
        )}`,
        percent: storagePercent,
        tone: storagePercent >= 90 ? "text-red-500" : "text-brand-primary",
      },
      {
        label: "Files Stored",
        value: snapshot.totalFiles.toLocaleString(),
        percent: NaN,
      },
      {
        label: "Upload Ops Today",
        value: `${snapshot.uploadOpsToday.toLocaleString()} / ${limits.uploadOpsDaily.toLocaleString()}`,
        percent: uploadOpsPercent,
        tone: uploadOpsPercent >= 90 ? "text-red-500" : "text-brand-primary",
      },
    ],
    [snapshot, limits, storagePercent, uploadOpsPercent]
  );

  const lastUpdated = formatDate(snapshot.lastUpdatedAt);
  const lastReconciled = snapshot.lastReconciledAt
    ? formatDate(snapshot.lastReconciledAt)
    : "Not yet reconciled";

  const uploadResetLabel = snapshot.uploadOpsResetAt
    ? new Date(snapshot.uploadOpsResetAt).toLocaleString()
    : "N/A";

  const handleRefresh = () =>
    startRefresh(async () => {
      try {
        await fetchSnapshot();
        toast.success("Ledger refreshed");
      } catch (error) {
        console.error(error);
        toast.error("Unable to refresh ledger data.");
      }
    });

  const handleReconcile = () =>
    startReconcile(async () => {
      try {
        const response = await fetch(getApiUrl("api/storage-ledger"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reconcile" }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to reconcile storage.");
        }
        const payload = await response.json();
        setSnapshot(payload.snapshot);
        toast.success("Storage ledger reconciled with Firebase.");
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Reconciliation failed."
        );
      }
    });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">
            Firebase Storage Ledger
          </p>
          <h2 className="text-2xl font-semibold text-brand-primary mt-1">
            Real-time usage & safety limits
          </h2>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isReconciling}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleReconcile} disabled={isReconciling}>
            {isReconciling ? "Reconciling..." : "Reconcile"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {formattedStats.map((stat) => (
          <Card
            key={stat.label}
            className="p-5 shadow-subtle border-brand-muted/40 bg-brand-surface/60"
          >
            <p className="text-sm text-brand-muted uppercase tracking-widest">
              {stat.label}
            </p>
            <p
              className={`mt-3 text-2xl font-semibold ${
                stat.tone ?? "text-brand-primary"
              }`}
            >
              {stat.value}
            </p>
            {!Number.isNaN(stat.percent) ? (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-brand-muted">
                  <span>0%</span>
                  <span>{stat.percent.toFixed(1)}%</span>
                </div>
                <Progress value={stat.percent} />
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <Card className="p-6 shadow-soft border-brand-muted/30 bg-brand-background space-y-4">
        <h3 className="text-lg font-semibold text-brand-primary">
          Daily safeguard
        </h3>
        <p className="text-sm text-brand-text/80">
          Uploads are automatically blocked once you approach Firebase&apos;s
          Blaze free tier: <strong>5 GB stored</strong> and{" "}
          <strong>20,000 upload operations / day</strong>. This prevents
          accidental overages. Download usage is not tracked because Firebase
          does not expose real-time download metrics.
        </p>
        <dl className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-lg border border-brand-muted/30 p-3">
            <dt className="text-brand-muted uppercase tracking-widest text-xs">
              Last updated
            </dt>
            <dd className="mt-1 text-brand-primary font-medium">
              {lastUpdated}
            </dd>
          </div>
          <div className="rounded-lg border border-brand-muted/30 p-3">
            <dt className="text-brand-muted uppercase tracking-widest text-xs">
              Upload counter resets
            </dt>
            <dd className="mt-1 text-brand-primary font-medium">
              {uploadResetLabel}
            </dd>
          </div>
          <div className="rounded-lg border border-brand-muted/30 p-3">
            <dt className="text-brand-muted uppercase tracking-widest text-xs">
              Last reconciled
            </dt>
            <dd className="mt-1 text-brand-primary font-medium">
              {lastReconciled}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6 border-dashed border-brand-muted/40 bg-brand-surface/40">
        <h3 className="text-base font-semibold text-brand-primary mb-2">
          Need precise numbers?
        </h3>
        <p className="text-sm text-brand-text/80">
          Reconciliation scans every file in Firebase Storage to ensure totals
          match exactly. Use this periodically if you delete files outside of
          the admin dashboard.
        </p>
        <p className="mt-2 text-xs text-brand-muted">
          Tip: keep gallery uploads lean—shortlist hero images and rely on WebP
          compression for best results.
        </p>
      </Card>
    </section>
  );
}

function formatGB(bytes: number): string {
  return `${(bytes / BYTES_IN_GB).toFixed(2)} GB`;
}

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function StorageLedgerSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-10 w-1/3 bg-brand-muted/30" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-32 rounded-xl bg-brand-muted/20" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl bg-brand-muted/20" />
    </div>
  );
}
