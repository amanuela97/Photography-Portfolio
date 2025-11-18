"use server";

import { revalidatePath } from "next/cache";
import {
  createPhoto,
  deletePhoto,
  updatePhoto,
  uploadPhotoFile,
} from "@/utils/data-access/photos";
import type { ActionState } from "./action-state";
import type { EventType } from "@/utils/types";

export async function createPhotoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const imageFile = formData.get("image") as File | null;
    let url = formData.get("url")?.toString() ?? "";

    if (imageFile && imageFile.size > 0) {
      const uploaded = await uploadPhotoFile(imageFile);
      if (uploaded) {
        url = uploaded;
      }
    }

    if (!url) throw new Error("Image URL is required.");

    await createPhoto({
      title: formData.get("title")?.toString() ?? "",
      url,
      eventType: (formData.get("eventType")?.toString() ?? "Other") as EventType,
      isFavorite: formData.get("isFavorite") === "on",
    });

    revalidatePath("/admin");
    return { status: "success", message: "Photo uploaded." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function togglePhotoFavoriteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Photo ID missing.");
    const isFavorite = formData.get("isFavorite") === "true";
    await updatePhoto(id, { isFavorite });
    revalidatePath("/admin");
    return { status: "success" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deletePhotoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Photo ID missing.");
    await deletePhoto(id);
    revalidatePath("/admin");
    return { status: "success", message: "Photo deleted." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

