"use server";

import { revalidatePath } from "next/cache";
import { saveProfile } from "@/utils/data-access/profile";
import type { ActionState } from "./action-state";
import type { ProfileDocument, SocialLink } from "@/utils/types";
import { parseJsonField } from "@/utils/data-access/helpers";

export async function saveProfileAction(
  _prevState: ActionState<ProfileDocument>,
  formData: FormData
): Promise<ActionState<ProfileDocument>> {
  try {
    const socials = parseJsonField<SocialLink[]>(formData.get("socials")) ?? [];

    const payload: ProfileDocument = {
      name: formData.get("name")?.toString() ?? "",
      title: formData.get("title")?.toString() ?? "",
      location: formData.get("location")?.toString() ?? "",
      bio: formData.get("bio")?.toString() ?? "",
      contact: {
        email: formData.get("email")?.toString() ?? "",
        phone: formData.get("phone")?.toString() ?? "",
        socials,
      },
    };

    await saveProfile(payload);
    revalidatePath("/admin");

    return {
      status: "success",
      message: "Profile updated successfully.",
      data: payload,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: (error as Error).message ?? "Unable to update profile.",
    };
  }
}
