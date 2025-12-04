"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Crop, RotateCw, ZoomIn } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number;
  initialZoom?: number;
}

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio,
  initialZoom = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      // Check if URL is a blob URL or data URL (same origin)
      const isBlobUrl = url.startsWith("blob:");
      const isDataUrl = url.startsWith("data:");

      // For external URLs (Firebase Storage), use proxy API to avoid CORS issues
      if (!isBlobUrl && !isDataUrl) {
        // Use proxy API to fetch image and avoid CORS taint issues
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;

        const loadHandler = () => resolve(image);
        const errorHandler = (error: Event | Error) => {
          // If proxy fails, try direct fetch as fallback
          console.warn(
            "Proxy failed, trying direct fetch:",
            error instanceof Error ? error.message : error
          );

          // Fallback: try direct fetch with crossOrigin
          image.crossOrigin = "anonymous";
          const fallbackLoadHandler = () => resolve(image);
          const fallbackErrorHandler = (fallbackError: Event | Error) => {
            reject(
              new Error(
                `Failed to load image: ${
                  fallbackError instanceof Error
                    ? fallbackError.message
                    : "CORS error - image cannot be cropped. Please ensure the image server allows CORS requests."
                }`
              )
            );
          };

          image.removeEventListener("load", loadHandler);
          image.removeEventListener("error", errorHandler);
          image.addEventListener("load", fallbackLoadHandler, { once: true });
          image.addEventListener("error", fallbackErrorHandler, { once: true });
          image.src = url;
        };

        image.addEventListener("load", loadHandler, { once: true });
        image.addEventListener("error", errorHandler, { once: true });
        image.src = proxyUrl;
        return; // Exit early, handlers are set above
      }

      // For blob URLs, data URLs
      const loadHandler = () => resolve(image);
      const errorHandler = (error: Event | Error) => {
        reject(
          new Error(
            `Failed to load image: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      };

      image.addEventListener("load", loadHandler, { once: true });
      image.addEventListener("error", errorHandler, { once: true });
      image.src = url;
    });
  };

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) +
        Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) +
        Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const rotRad = getRadianAngle(rotation);

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to match bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Move canvas center and rotate
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Extract the cropped area
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;
    const croppedCtx = croppedCanvas.getContext("2d");

    if (!croppedCtx) {
      throw new Error("No 2d context for cropped canvas");
    }

    // Draw the cropped portion from the rotated canvas
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      try {
        croppedCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Canvas is empty or could not be converted to blob. This might be due to CORS restrictions."
                )
              );
              return;
            }
            resolve(blob);
          },
          "image/webp",
          0.95
        );
      } catch (error) {
        reject(
          new Error(
            `Failed to export canvas: ${
              error instanceof Error ? error.message : "Unknown error"
            }. This might be due to CORS restrictions or a tainted canvas.`
          )
        );
      }
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      // Create a File from the blob
      const croppedFile = new File(
        [croppedBlob],
        `cropped-${Date.now()}.webp`,
        { type: "image/webp" }
      );

      onCropComplete(croppedFile);
      onOpenChange(false);
    } catch (error) {
      console.error("Error cropping image:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Failed to crop image. Please try again.";

      // Show error to user
      alert(
        `Error: ${errorMessage}. This might be due to CORS restrictions. Please ensure the image is accessible.`
      );
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // When closing, reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(initialZoom);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw]! w-[95vw]! h-[90vh]! max-h-[90vh]! p-0! gap-0! flex! flex-col! bg-background! overflow-hidden! translate-x-[-50%]! translate-y-[-50%]! top-[50%]! left-[50%]!">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Reframe Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area to ensure proper headroom and framing. Use the
            controls below to zoom, rotate, and position the image.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full flex-1 min-h-0 bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
            }}
          />
        </div>

        <div className="px-6 py-4 space-y-4 border-t shrink-0 bg-background">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <ZoomIn className="w-4 h-4" />
                <span>Zoom</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => onZoomChange(value)}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <RotateCw className="w-4 h-4" />
                <span>Rotation</span>
              </div>
              <span className="text-xs text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={([value]) => onRotationChange(value)}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 shrink-0 bg-background border-t flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="min-w-[100px] border-2 text-black"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="min-w-[100px] bg-primary border-2 text-black hover:bg-primary/90"
          >
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
