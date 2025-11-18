"use server";

import { revalidatePath } from "next/cache";
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from "@/utils/data-access/testimonials";
import type { ActionState } from "./action-state";

export async function createTestimonialAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createTestimonial({
      quote: formData.get("quote")?.toString() ?? "",
      author: formData.get("author")?.toString() ?? "",
      isApproved: formData.get("isApproved") === "on",
      isFeatured: formData.get("isFeatured") === "on",
    });
    revalidatePath("/admin");
    return { status: "success", message: "Testimonial created." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function updateTestimonialAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Testimonial ID missing.");
    await updateTestimonial(id, {
      quote: formData.get("quote")?.toString(),
      author: formData.get("author")?.toString(),
      isApproved: formData.get("isApproved") === "true",
      isFeatured: formData.get("isFeatured") === "true",
    });
    revalidatePath("/admin");
    return { status: "success" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deleteTestimonialAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Testimonial ID missing.");
    await deleteTestimonial(id);
    revalidatePath("/admin");
    return { status: "success", message: "Testimonial deleted." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

