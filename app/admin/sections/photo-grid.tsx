"use client";

import { useActionState, useEffect, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import type { PhotoDocument } from "@/utils/types";
import {
  deletePhotoAction,
  togglePhotoFavoriteAction,
} from "../actions/photos-actions";
import { initialActionState } from "../actions/action-state";

interface PhotoGridProps {
  photos: PhotoDocument[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}

function PhotoCard({ photo }: { photo: PhotoDocument }) {
  const [favoriteState, toggleFavorite] = useActionState(
    togglePhotoFavoriteAction,
    initialActionState()
  );
  const [deleteState, deletePhoto] = useActionState(
    deletePhotoAction,
    initialActionState()
  );
  const [pendingFavorite, startFavorite] = useTransition();
  const [pendingDelete, startDelete] = useTransition();

  useEffect(() => {
    if (favoriteState.status === "error") {
      toast.error(favoriteState.message ?? "Unable to update favorite state.");
    }
  }, [favoriteState]);

  useEffect(() => {
    if (deleteState.status === "success") {
      toast.success("Photo deleted.");
    } else if (deleteState.status === "error") {
      toast.error(deleteState.message ?? "Unable to delete photo.");
    }
  }, [deleteState]);

  return (
    <Card className="overflow-hidden border border-brand-muted/40 bg-brand-surface shadow-soft">
      <div className="relative aspect-4/3">
        <Image
          src={photo.url}
          alt={photo.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          unoptimized
        />
      </div>
      <CardContent className="space-y-2 py-4">
        <p className="text-lg font-semibold text-brand-primary">
          {photo.title}
        </p>
        <p className="text-sm text-brand-muted">{photo.eventType}</p>
        <div className="flex items-center gap-2">
          <Switch
            id={`favorite-${photo.id}`}
            defaultChecked={photo.isFavorite}
            disabled={pendingFavorite}
            onCheckedChange={(checked) => {
              const formData = new FormData();
              formData.append("id", photo.id);
              formData.append("isFavorite", checked ? "true" : "false");
              startFavorite(() => toggleFavorite(formData));
            }}
          />
          <Label htmlFor={`favorite-${photo.id}`}>Favorite</Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.open(photo.url, "_blank")}
        >
          View
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pendingDelete}
          onClick={() => {
            const formData = new FormData();
            formData.append("id", photo.id);
            startDelete(() => deletePhoto(formData));
          }}
        >
          {pendingDelete ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
}
