import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveProfile } from "@/utils/data-access/profile";
import type { ProfileDocument, SocialLink } from "@/utils/types";
import { parseJsonField } from "@/utils/data-access/helpers";
import {
  deleteFilesInFolder,
  uploadFileToStorage,
} from "@/utils/data-access/storage";

const PORTRAIT_FOLDER = "site/profile/portrait";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const socials = parseJsonField<SocialLink[]>(formData.get("socials")) ?? [];
    const currentPortrait =
      formData.get("currentPortraitImage")?.toString() ?? "";
    const portraitFile = formData.get("portraitImage");

    let portraitImage = currentPortrait;
    if (
      portraitFile instanceof File &&
      portraitFile.size > 0 &&
      portraitFile.name !== "undefined"
    ) {
      await deleteFilesInFolder(PORTRAIT_FOLDER);
      const extension = extractExtension(portraitFile.name) || ".jpg";
      portraitImage = await uploadFileToStorage(portraitFile, {
        path: `${PORTRAIT_FOLDER}/portrait${extension}`,
      });
    }

    const payload: ProfileDocument = {
      name: formData.get("name")?.toString() ?? "",
      title: formData.get("title")?.toString() ?? "",
      location: formData.get("location")?.toString() ?? "",
      bio: formData.get("bio")?.toString() ?? "",
      portraitImage,
      contact: {
        email: formData.get("email")?.toString() ?? "",
        phone: formData.get("phone")?.toString() ?? "",
        socials,
      },
    };

    await saveProfile(payload);

    revalidatePath("/admin");
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    revalidatePath("/about");

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      portraitImageUrl: portraitImage,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        error:
          (error as Error).message ??
          "Unable to update profile. Please try again later.",
      },
      { status: 500 }
    );
  }
}

function extractExtension(name: string): string {
  const match = name.match(/\.[^/.]+$/);
  return match ? match[0].toLowerCase() : "";
}
