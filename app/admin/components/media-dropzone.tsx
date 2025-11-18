"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface MediaDropzoneProps {
  name: string;
  label: string;
  description?: string;
  accept?: Accept;
  multiple?: boolean;
  progress?: number;
  onFilesChange?: (files: File[]) => void;
  existingFiles?: string[];
  onRemoveExisting?: (index: number) => void;
  disabled?: boolean;
}

export function MediaDropzone({
  name,
  label,
  description,
  accept,
  multiple,
  progress = 0,
  onFilesChange,
  existingFiles,
  onRemoveExisting,
  disabled = false,
}: MediaDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setSelectedFiles(acceptedFiles);
      onFilesChange?.(acceptedFiles);
    },
    [onFilesChange]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept,
    multiple,
    noClick: true,
    disabled,
  });

  const showProgress = progress > 0 && progress <= 100;

  const dropLabel = useMemo(() => {
    if (selectedFiles.length === 0) {
      return multiple ? "Drop files here" : "Drop a file here";
    }
    if (multiple) {
      return `${selectedFiles.length} file(s) selected`;
    }
    return selectedFiles[0]?.name;
  }, [multiple, selectedFiles]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openFileDialog}
          disabled={disabled}
          className="text-brand-primary"
        >
          Browse
        </Button>
      </div>
      {description ? (
        <p className="text-sm text-brand-muted">{description}</p>
      ) : null}
      <div
        {...getRootProps()}
        className={cn(
          "rounded-2xl border-2 border-dashed bg-brand-background/40 p-6 text-sm transition",
          disabled && "opacity-50 cursor-not-allowed",
          isDragActive && !disabled
            ? "border-brand-primary bg-brand-primary/10"
            : "border-brand-muted/60 hover:border-brand-primary"
        )}
      >
        <input {...getInputProps({ name })} />
        <p className="text-brand-text">
          {isDragActive
            ? "Drop the files here ..."
            : `${dropLabel}. Drag & drop or use Browse.`}
        </p>
      </div>
      {showProgress ? (
        <Progress value={progress} className="h-2 bg-brand-muted/40" />
      ) : null}
      {existingFiles && existingFiles.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-brand-muted/40 bg-brand-background/40 p-4">
          <p className="text-sm font-semibold text-brand-primary">Existing media</p>
          <ul className="space-y-2 text-sm text-brand-text">
            {existingFiles.map((url, index) => (
              <li key={url} className="flex items-center justify-between gap-2">
                <span className="truncate">{url}</span>
                {onRemoveExisting ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveExisting(index)}
                    className="text-brand-primary"
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

