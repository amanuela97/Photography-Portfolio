"use server";

import { revalidatePath } from "next/cache";
import { saveAbout } from "@/utils/data-access/about";
import type { AboutDocument, GearItem, ProcessStep } from "@/utils/types";
import type { ActionState } from "./action-state";
import { parseJsonField } from "@/utils/data-access/helpers";

export async function saveAboutAction(
  _prevState: ActionState<AboutDocument>,
  formData: FormData
): Promise<ActionState<AboutDocument>> {
  try {
    const steps =
      parseJsonField<ProcessStep[]>(formData.get("processSteps")) ?? [];
    const camera = parseJsonField<GearItem[]>(formData.get("cameraGear")) ?? [];
    const lenses = parseJsonField<GearItem[]>(formData.get("lensGear")) ?? [];
    const software =
      parseJsonField<GearItem[]>(formData.get("softwareGear")) ?? [];

    // Get landscape image URL from form (uploaded via API route)
    const landscapeImageUrl =
      formData.get("landscapeImageUrl")?.toString().trim() ?? "";
    const landscapeImage = landscapeImageUrl;

    const payload: AboutDocument = {
      hero: {
        intro: formData.get("heroIntro")?.toString() ?? "",
        landscapeImage,
      },
      story: {
        whoIAm: formData.get("storyWhoIAm")?.toString() ?? "",
        inspiration: formData.get("storyInspiration")?.toString() ?? "",
        howIStarted: formData.get("storyHowIStarted")?.toString() ?? "",
        philosophy: formData.get("storyPhilosophy")?.toString() ?? "",
      },
      process: {
        intro: formData.get("processIntro")?.toString() ?? "",
        whatToExpect: formData.get("processExpect")?.toString() ?? "",
        steps,
      },
      gear: {
        camera,
        lenses,
        software,
      },
    };

    await saveAbout(payload);
    revalidatePath("/admin");

    return {
      status: "success",
      message: "About content updated.",
      data: payload,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: (error as Error).message ?? "Unable to update content.",
    };
  }
}
