import { getAbout } from "@/utils/data-access/about";
import { AboutForm } from "./about-form";

export default async function AboutManager() {
  const about = await getAbout({ fresh: true });
  // Use a stable key to prevent unnecessary remounts
  // The form will update its state from the action response instead
  return <AboutForm about={about ?? undefined} />;
}
