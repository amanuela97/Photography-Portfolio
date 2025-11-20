"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from "@/utils/data-access/testimonials";
import type { ActionState } from "./action-state";

const TESTIMONIALS_TAG = "testimonials";
const FEATURED_TESTIMONIALS_TAG = "featured-testimonials";

export async function createTestimonialAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // Public submissions default to not approved and not featured
    // Only admins can set these via the admin panel
    await createTestimonial({
      quote: formData.get("quote")?.toString() ?? "",
      author: formData.get("author")?.toString() ?? "",
      isApproved: formData.get("isApproved") === "on" || false,
      isFeatured: formData.get("isFeatured") === "on" || false,
    });
    revalidatePath("/admin");
    revalidatePath("/testimonials");
    revalidatePath("/testimonials/create");
    revalidateTag(TESTIMONIALS_TAG, "default");
    revalidateTag(FEATURED_TESTIMONIALS_TAG, "default");
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
    revalidateTag(TESTIMONIALS_TAG, "default");
    revalidateTag(FEATURED_TESTIMONIALS_TAG, "default");
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
    revalidateTag(TESTIMONIALS_TAG, "default");
    revalidateTag(FEATURED_TESTIMONIALS_TAG, "default");
    return { status: "success", message: "Testimonial deleted." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
