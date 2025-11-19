"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Star, Trash2, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import type { PhotoDocument, EventType } from "@/utils/types";

const EVENT_TYPES: EventType[] = [
  "Wedding",
  "Birthday",
  "Baby Showers",
  "Elopement",
  "Birthdays",
  "Ceremonies",
  "Anniversaries",
  "Engagements",
  "Graduation",
  "Other",
];

interface PhotoGridProps {
  photos: PhotoDocument[];
}

export function PhotoGrid({ photos: initialPhotos }: PhotoGridProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoDocument[]>(initialPhotos);

  // Update local state when props change (e.g., after router.refresh())
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const favoriteCount = photos.filter((p) => p.isFavorite).length;
  const maxFavorites = 6;

  const handlePhotoDelete = (deletedId: string) => {
    // Optimistically remove the photo from the list
    setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
    // Refresh server data to sync
    router.refresh();
  };

  if (!photos.length) {
    return (
      <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
        <CardContent className="py-6 text-brand-muted">
          No photos uploaded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {favoriteCount >= maxFavorites && (
        <Alert className="border-brand-accent bg-brand-accent/10">
          <AlertCircle className="h-4 w-4 text-brand-accent" />
          <AlertDescription className="text-brand-text">
            Maximum of {maxFavorites} favorite photos reached. Please deselect a
            favorite photo before selecting another one.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            favoriteCount={favoriteCount}
            maxFavorites={maxFavorites}
            onDelete={handlePhotoDelete}
            priority={index < 6} // Prioritize first 6 images
          />
        ))}
      </div>
    </div>
  );
}

interface PhotoCardProps {
  photo: PhotoDocument;
  favoriteCount: number;
  maxFavorites: number;
  onDelete: (id: string) => void;
  priority?: boolean;
}

function PhotoCard({
  photo,
  favoriteCount,
  maxFavorites,
  onDelete,
  priority = false,
}: PhotoCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(photo.isFavorite);
  const [pendingFavorite, setPendingFavorite] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(photo.title);
  const [pendingTitleUpdate, setPendingTitleUpdate] = useState(false);
  const [isEditingEventType, setIsEditingEventType] = useState(false);
  const [eventType, setEventType] = useState<EventType>(photo.eventType);
  const [pendingEventTypeUpdate, setPendingEventTypeUpdate] = useState(false);

  // Update local state when photo prop changes
  useEffect(() => {
    setIsFavorite(photo.isFavorite);
    setTitle(photo.title);
    setEventType(photo.eventType);
  }, [photo.isFavorite, photo.title, photo.eventType]);

  const handleTitleSave = async () => {
    if (title.trim() === photo.title.trim()) {
      setIsEditingTitle(false);
      return;
    }

    if (title.trim() === "") {
      toast.error("Title cannot be empty");
      setTitle(photo.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      setPendingTitleUpdate(true);
      const formData = new FormData();
      formData.append("id", photo.id);
      formData.append("title", title.trim());

      const response = await fetch("/api/photos", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update title");
      }

      toast.success("Title updated successfully!", { duration: 3000 });
      setIsEditingTitle(false);
      // Refresh to sync with server
      router.refresh();
    } catch (error) {
      console.error("Title update error:", error);
      toast.error((error as Error).message || "Unable to update title.", {
        duration: 4000,
      });
      setTitle(photo.title);
      setIsEditingTitle(false);
    } finally {
      setPendingTitleUpdate(false);
    }
  };

  const handleEventTypeSave = async () => {
    if (eventType === photo.eventType) {
      setIsEditingEventType(false);
      return;
    }

    try {
      setPendingEventTypeUpdate(true);
      const formData = new FormData();
      formData.append("id", photo.id);
      formData.append("eventType", eventType);

      const response = await fetch("/api/photos", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update event type");
      }

      toast.success("Event type updated successfully!", { duration: 3000 });
      setIsEditingEventType(false);
      // Refresh to sync with server
      router.refresh();
    } catch (error) {
      console.error("Event type update error:", error);
      toast.error((error as Error).message || "Unable to update event type.", {
        duration: 4000,
      });
      setEventType(photo.eventType);
      setIsEditingEventType(false);
    } finally {
      setPendingEventTypeUpdate(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-brand-muted/40 bg-brand-surface shadow-soft group">
      <div className="relative aspect-4/3">
        <Image
          src={photo.url}
          alt={photo.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          unoptimized
        />
        {/* Delete icon button overlay */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-4 right-4 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
          disabled={pendingDelete}
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-6 w-6" />
        </Button>
        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 p-4 z-10">
            <div className="bg-brand-surface rounded-lg p-4 space-y-3 max-w-xs">
              <p className="text-sm font-medium text-brand-text text-center">
                Delete this photo?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-brand-text hover:text-white hover:bg-brand-primary cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pendingDelete}
                  onClick={async () => {
                    try {
                      setPendingDelete(true);
                      toast.loading("Deleting photo...", {
                        id: `photo-delete-${photo.id}`,
                      });

                      const formData = new FormData();
                      formData.append("id", photo.id);
                      formData.append("url", photo.url);

                      const response = await fetch("/api/photos", {
                        method: "DELETE",
                        body: formData,
                      });

                      const result = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          result.error || "Failed to delete photo"
                        );
                      }

                      toast.success(
                        result.message || "Photo deleted successfully!",
                        {
                          id: `photo-delete-${photo.id}`,
                          duration: 4000,
                        }
                      );

                      // Remove photo from UI immediately
                      onDelete(photo.id);
                    } catch (error) {
                      console.error("Photo delete error:", error);
                      toast.error(
                        (error as Error).message || "Unable to delete photo.",
                        { id: `photo-delete-${photo.id}`, duration: 4000 }
                      );
                      setShowDeleteConfirm(false);
                    } finally {
                      setPendingDelete(false);
                    }
                  }}
                  className="flex-1 text-brand-text hover:text-white hover:bg-brand-primary cursor-pointer"
                >
                  {pendingDelete ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-brand-background text-brand-text h-8 text-sm"
                disabled={pendingTitleUpdate}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleSave();
                  } else if (e.key === "Escape") {
                    setTitle(photo.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={pendingTitleUpdate}
                onClick={handleTitleSave}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={pendingTitleUpdate}
                onClick={() => {
                  setTitle(photo.title);
                  setIsEditingTitle(false);
                }}
              >
                <X className="h-4 w-4 text-brand-muted" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-brand-primary flex-1">
                {title}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditingTitle(true)}
              >
                <Edit2 className="h-4 w-4 text-brand-muted" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditingEventType ? (
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={eventType}
                onValueChange={(value) => setEventType(value as EventType)}
                disabled={pendingEventTypeUpdate}
              >
                <SelectTrigger className="flex-1 h-8 bg-brand-background text-brand-text text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-background text-brand-text">
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={pendingEventTypeUpdate}
                onClick={handleEventTypeSave}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={pendingEventTypeUpdate}
                onClick={() => {
                  setEventType(photo.eventType);
                  setIsEditingEventType(false);
                }}
              >
                <X className="h-4 w-4 text-brand-muted" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-brand-muted flex-1">{eventType}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditingEventType(true)}
              >
                <Edit2 className="h-4 w-4 text-brand-muted" />
              </Button>
            </>
          )}
        </div>
        <Button
          type="button"
          variant={isFavorite ? "default" : "outline"}
          size="sm"
          disabled={pendingFavorite}
          onClick={async () => {
            const checked = !isFavorite;
            // Check favorite limit before making API call
            if (checked && !isFavorite) {
              // Trying to add a favorite
              // favoriteCount is the current count (doesn't include this photo since isFavorite is false)
              // After adding, count would be favoriteCount + 1
              if (favoriteCount >= maxFavorites) {
                toast.error(
                  `Only ${maxFavorites} photos can be marked as favorite. Please deselect another favorite photo first.`,
                  { duration: 5000 }
                );
                return;
              }
            }

            try {
              setPendingFavorite(true);
              setIsFavorite(checked); // Optimistic update

              const formData = new FormData();
              formData.append("id", photo.id);
              formData.append("isFavorite", checked ? "true" : "false");

              const response = await fetch("/api/photos", {
                method: "PUT",
                body: formData,
              });

              const result = await response.json();

              if (!response.ok) {
                // Revert optimistic update on error
                setIsFavorite(!checked);
                throw new Error(result.error || "Failed to update favorite");
              }

              toast.success(
                checked
                  ? "Photo marked as favorite"
                  : "Photo removed from favorites",
                { duration: 3000 }
              );
            } catch (error) {
              console.error("Favorite toggle error:", error);
              toast.error(
                (error as Error).message || "Unable to update favorite state.",
                { duration: 4000 }
              );
            } finally {
              setPendingFavorite(false);
            }
          }}
          className={`w-full ${
            isFavorite
              ? "bg-brand-accent text-brand-primary hover:bg-brand-accent/90"
              : "border-brand-muted hover:bg-brand-background"
          }`}
        >
          <Star
            className={`h-4 w-4 mr-2 ${
              isFavorite
                ? "fill-brand-primary text-brand-primary"
                : "text-brand-muted"
            }`}
          />
          {isFavorite ? "Favorited" : "Mark as Favorite"}
        </Button>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.open(photo.url, "_blank")}
          className="w-full"
        >
          View Full Image
        </Button>
      </CardFooter>
    </Card>
  );
}
