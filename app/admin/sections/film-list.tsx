"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Check, X, Play } from "lucide-react";
import toast from "react-hot-toast";
import type { FilmDocument } from "@/utils/types";

interface FilmListProps {
  films: FilmDocument[];
}

export function FilmList({ films: initialFilms }: FilmListProps) {
  const router = useRouter();
  const [films, setFilms] = useState<FilmDocument[]>(initialFilms);

  // Update local state when props change (e.g., after router.refresh())
  useEffect(() => {
    setFilms(initialFilms);
  }, [initialFilms]);

  const handleFilmDelete = (deletedId: string) => {
    // Optimistically remove the film from the list
    setFilms((prev) => prev.filter((f) => f.id !== deletedId));
    // Refresh server data to sync
    router.refresh();
  };

  if (!films.length) {
    return (
      <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
        <CardContent className="py-6 text-brand-muted">
          No films added yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {films.map((film) => (
        <FilmCard key={film.id} film={film} onDelete={handleFilmDelete} />
      ))}
    </div>
  );
}

interface FilmCardProps {
  film: FilmDocument;
  onDelete: (id: string) => void;
}

function FilmCard({ film, onDelete }: FilmCardProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(film.title);
  const [pendingTitleUpdate, setPendingTitleUpdate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update local state when film prop changes
  useEffect(() => {
    setTitle(film.title);
  }, [film.title]);

  const handleTitleSave = async () => {
    if (title.trim() === film.title.trim()) {
      setIsEditingTitle(false);
      return;
    }

    if (title.trim() === "") {
      toast.error("Title cannot be empty");
      setTitle(film.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      setPendingTitleUpdate(true);
      const formData = new FormData();
      formData.append("id", film.id);
      formData.append("title", title.trim());

      const response = await fetch("/api/films", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update title");
      }

      toast.success("Title updated successfully!", {
        duration: 3000,
        position: "top-right",
      });
      setIsEditingTitle(false);
      router.refresh();
    } catch (error) {
      console.error("Title update error:", error);
      toast.error((error as Error).message || "Unable to update title.", {
        duration: 4000,
        position: "top-right",
      });
      setTitle(film.title);
      setIsEditingTitle(false);
    } finally {
      setPendingTitleUpdate(false);
    }
  };

  const handleDelete = async () => {
    try {
      setPendingDelete(true);
      toast.loading("Deleting film...", {
        id: `film-delete-${film.id}`,
      });

      const formData = new FormData();
      formData.append("id", film.id);
      formData.append("url", film.url);

      const response = await fetch("/api/films", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete film");
      }

      toast.success(result.message || "Film deleted successfully!", {
        id: `film-delete-${film.id}`,
        duration: 4000,
        position: "top-right",
      });

      // Remove film from UI immediately
      onDelete(film.id);
    } catch (error) {
      console.error("Film delete error:", error);
      toast.error((error as Error).message || "Unable to delete film.", {
        id: `film-delete-${film.id}`,
        duration: 4000,
      });
      setShowDeleteConfirm(false);
    } finally {
      setPendingDelete(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-brand-muted/40 bg-brand-surface shadow-soft group">
      {/* Video Player */}
      <div className="relative aspect-video bg-brand-primary/10">
        <video
          ref={videoRef}
          src={film.url}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
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
                Delete this film?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-brand-text hover:text-white hover:bg-brand-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pendingDelete}
                  onClick={handleDelete}
                  className="flex-1"
                >
                  {pendingDelete ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CardHeader>
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
                    setTitle(film.title);
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
                  setTitle(film.title);
                  setIsEditingTitle(false);
                }}
              >
                <X className="h-4 w-4 text-brand-muted" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-brand-primary flex-1">
                {title}
              </h3>
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
      </CardHeader>

      <CardFooter className="flex items-center justify-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.requestFullscreen();
            } else {
              window.open(film.url, "_blank");
            }
          }}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Play Fullscreen
        </Button>
      </CardFooter>
    </Card>
  );
}
