"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createFilm, deleteFilm, updateFilm } from "@/utils/data-access/films";
import type { ActionState } from "./action-state";

const FILMS_TAG = "films";

export async function createFilmAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createFilm({
      title: formData.get("title")?.toString() ?? "",
      url: formData.get("url")?.toString() ?? "",
    });
    revalidatePath("/admin");
    revalidateTag(FILMS_TAG, "default");
    return { status: "success", message: "Film added." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function updateFilmAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Film ID missing.");
    await updateFilm(id, {
      title: formData.get("title")?.toString(),
      url: formData.get("url")?.toString(),
    });
    revalidatePath("/admin");
    revalidateTag(FILMS_TAG, "default");
    return { status: "success" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deleteFilmAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Film ID missing.");
    await deleteFilm(id);
    revalidatePath("/admin");
    revalidateTag(FILMS_TAG, "default");
    return { status: "success", message: "Film deleted." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
