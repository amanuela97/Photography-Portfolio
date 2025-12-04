"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, FileVideo, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ImageCropModal } from "./image-crop-modal";

interface MediaDropzoneProps {
  name: string;
  label: string;
  description?: string;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  progress?: number;
  onFilesChange?: (files: File[]) => void;
  existingFiles?: string[];
  onRemoveExisting?: (index?: number) => void;
  onExistingFileCrop?: (croppedFile: File, index: number) => void;
  onExistingFilePreviewUpdate?: (previewUrl: string, index: number) => void;
  disabled?: boolean;
  enableCrop?: boolean;
  aspectRatio?: number;
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
  onExistingFileCrop,
  onExistingFilePreviewUpdate,
  disabled = false,
  enableCrop = true,
  aspectRatio,
}: MediaDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{
    file?: File;
    url: string;
    index: number;
    isExisting?: boolean;
  } | null>(null);
  // Store preview URLs for existing files that have been cropped
  const [existingFilePreviews, setExistingFilePreviews] = useState<
    Map<number, string>
  >(new Map());
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

  const handleCropClick = (file: File, index: number) => {
    const url = URL.createObjectURL(file);
    setImageToCrop({ file, index, url, isExisting: false });
    setCropModalOpen(true);
  };

  const handleExistingFileCropClick = (fileUrl: string, index: number) => {
    setImageToCrop({ url: fileUrl, index, isExisting: true });
    setCropModalOpen(true);
  };

  const handleCropComplete = (croppedFile: File) => {
    if (!imageToCrop) return;

    // Clean up the old object URL if it was a blob URL
    if (imageToCrop.file) {
      URL.revokeObjectURL(imageToCrop.url);
    }

    if (imageToCrop.isExisting) {
      // Create preview URL for the cropped file
      const previewUrl = URL.createObjectURL(croppedFile);

      // Update preview immediately so admin can see the cropped version
      setExistingFilePreviews((prev) => {
        const newMap = new Map(prev);
        newMap.set(imageToCrop.index, previewUrl);
        return newMap;
      });

      // Also notify parent component to update preview
      onExistingFilePreviewUpdate?.(previewUrl, imageToCrop.index);

      // Handle existing file crop - call the callback to upload
      onExistingFileCrop?.(croppedFile, imageToCrop.index);
    } else {
      // Handle new file crop - replace in files array
      const newFiles = files.map((file, idx) =>
        idx === imageToCrop.index ? croppedFile : file
      );

      setFiles(newFiles);
      onFilesChange?.(newFiles);
    }

    setImageToCrop(null);
    setCropModalOpen(false);
  };

  const handleCropCancel = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop.url);
      setImageToCrop(null);
    }
    setCropModalOpen(false);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      existingFilePreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [existingFilePreviews]);

  // Separate component for file preview to manage object URLs properly
  function FilePreviewItem({
    file,
    index,
    isImageFile,
    enableCrop,
    disabled,
    onCropClick,
    onRemove,
  }: {
    file: File;
    index: number;
    isImageFile: boolean;
    enableCrop: boolean;
    disabled: boolean;
    onCropClick: (file: File, index: number) => void;
    onRemove: (index: number) => void;
  }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
      if (isImageFile) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setPreviewUrl(null);
      }
      // Use file properties instead of file object to detect changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file.name, file.size, file.lastModified, isImageFile]);

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
        {isImageFile && previewUrl ? (
          <div className="relative w-16 h-16 rounded overflow-hidden shrink-0 border border-border">
            <Image
              src={previewUrl}
              alt={file.name}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
        ) : (
          <FileImage className="w-5 h-5 text-accent shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {file.name}
          </p>
          <p className="text-xs text-muted">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isImageFile && enableCrop && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onCropClick(file, index)}
              disabled={disabled}
              className="h-8 w-8"
              title="Reframe image"
            >
              <Crop className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

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
          {existingFiles.map((fileUrl, index) => {
            // Use cropped preview if available, otherwise use original URL
            const previewUrl = existingFilePreviews.get(index) || fileUrl;

            return (
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
                        onClick={() => onRemoveExisting(index)}
                        disabled={disabled}
                        className="absolute top-4 right-4 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-video group">
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Existing file"
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 50vw, 100vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {enableCrop && onExistingFileCrop && !isVideo && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleExistingFileCropClick(fileUrl, index)
                          }
                          disabled={disabled}
                          className="h-10 w-10 bg-black/50 hover:bg-black/70 border-white/20 text-white"
                          title="Reframe image"
                        >
                          <Crop className="h-4 w-4" />
                        </Button>
                      )}
                      {onRemoveExisting && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10 bg-black/50 hover:bg-black/70 cursor-pointer"
                          onClick={() => {
                            // Clean up preview URL if it exists
                            const preview = existingFilePreviews.get(index);
                            if (preview) {
                              URL.revokeObjectURL(preview);
                              setExistingFilePreviews((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(index);
                                return newMap;
                              });
                            }
                            onRemoveExisting(index);
                          }}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4 text-white" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
            {files.map((file, index) => {
              const isImageFile = file.type.startsWith("image/");
              // Use file name and last modified as key to force re-render when file changes
              const fileKey = `${file.name}-${file.lastModified}-${file.size}`;

              return (
                <FilePreviewItem
                  key={fileKey}
                  file={file}
                  index={index}
                  isImageFile={isImageFile}
                  enableCrop={enableCrop && !isVideo}
                  disabled={disabled}
                  onCropClick={handleCropClick}
                  onRemove={removeFile}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          open={cropModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCropCancel();
            } else {
              setCropModalOpen(true);
            }
          }}
          imageSrc={imageToCrop.url}
          onCropComplete={handleCropComplete}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  );
}
