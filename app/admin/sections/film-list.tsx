"use client";

import { useActionState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { FilmDocument } from "@/utils/types";
import {
  deleteFilmAction,
  updateFilmAction,
} from "../actions/films-actions";
import { initialActionState } from "../actions/action-state";

interface FilmListProps {
  films: FilmDocument[];
}

export function FilmList({ films }: FilmListProps) {
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
    <div className="grid gap-4 md:grid-cols-2">
      {films.map((film) => (
        <FilmCard key={film.id} film={film} />
      ))}
    </div>
  );
}

function FilmCard({ film }: { film: FilmDocument }) {
  const [updateState, updateAction] = useActionState(
    updateFilmAction,
    initialActionState()
  );
  const [deleteState, deleteAction] = useActionState(
    deleteFilmAction,
    initialActionState()
  );
  const [pendingUpdate, startUpdate] = useTransition();
  const [pendingDelete, startDelete] = useTransition();

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success("Film updated.");
    } else if (updateState.status === "error") {
      toast.error(updateState.message ?? "Unable to update film.");
    }
  }, [updateState]);

  useEffect(() => {
    if (deleteState.status === "success") {
      toast.success("Film deleted.");
    } else if (deleteState.status === "error") {
      toast.error(deleteState.message ?? "Unable to delete film.");
    }
  }, [deleteState]);

  return (
    <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
      <CardHeader>
        <CardTitle className="text-brand-primary">{film.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => startUpdate(() => updateAction(formData))}
        >
          <input type="hidden" name="id" value={film.id} />
          <Input
            name="title"
            defaultValue={film.title}
            className="bg-brand-background text-brand-text"
          />
          <Input
            name="url"
            defaultValue={film.url}
            className="bg-brand-background text-brand-text"
          />
          <CardFooter className="px-0 gap-3">
            <Button
              type="submit"
              disabled={pendingUpdate}
              className="bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
            >
              {pendingUpdate ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(film.url, "_blank")}
            >
              Watch
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pendingDelete}
              className="ml-auto"
              onClick={() => {
                const formData = new FormData();
                formData.append("id", film.id);
                startDelete(() => deleteAction(formData));
              }}
            >
              {pendingDelete ? "Deleting..." : "Delete"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
