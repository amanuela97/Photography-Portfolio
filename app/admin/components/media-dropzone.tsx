"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface MediaDropzoneProps {
  name: string;
  label: string;
  description?: string;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  progress?: number;
  onFilesChange?: (files: File[]) => void;
  existingFiles?: string[];
  onRemoveExisting?: () => void;
  disabled?: boolean;
}

export function MediaDropzone({
  name,
  label,
  description,
  accept = { "image/*": [] },
  multiple = false,
  progress = 0,
  onFilesChange,
  existingFiles = [],
  onRemoveExisting,
  disabled = false,
}: MediaDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const isVideo = accept["video/*"] !== undefined;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      onFilesChange?.(acceptedFiles);
    },
    [onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        {description && (
          <p className="text-xs text-muted mt-1">{description}</p>
        )}
      </div>

      {/* Existing Files Display */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((fileUrl, index) => (
            <div
              key={index}
              className="relative rounded-lg border-2 border-border overflow-hidden bg-background"
            >
              {isVideo ? (
                <div className="flex items-center gap-3 p-4">
                  <FileVideo className="w-8 h-8 text-accent" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Current Video
                    </p>
                    <p className="text-xs text-muted truncate">{fileUrl}</p>
                  </div>
                  {onRemoveExisting && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onRemoveExisting}
                      disabled={disabled}
                      className="absolute top-4 right-4 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative aspect-video">
                  <Image
                    src={fileUrl || "/placeholder.svg"}
                    alt="Existing file"
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    unoptimized
                  />
                  {onRemoveExisting && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-10 w-10 group-hover:opacity-100 transition-opacity shadow-lg z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
                      onClick={onRemoveExisting}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
          ${
            isDragActive
              ? "border-accent bg-accent/5"
              : "border-border bg-background"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-accent hover:bg-accent/5"
          }
        `}
      >
        <input {...getInputProps()} name={name} />
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {isVideo ? (
            <FileVideo className="w-12 h-12 text-muted" />
          ) : (
            <Upload className="w-12 h-12 text-muted" />
          )}
          {isDragActive ? (
            <p className="text-sm font-medium text-accent">
              Drop files here...
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                Drag & drop {multiple ? "files" : "a file"} here, or click to
                select
              </p>
              <p className="text-xs text-muted">
                {isVideo ? "Supports video files" : "Supports image files"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Uploading...</span>
            <span className="font-medium text-accent">{progress}%</span>
          </div>
          <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted">Selected Files:</Label>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20"
              >
                <FileImage className="w-5 h-5 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
