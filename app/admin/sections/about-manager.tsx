import { getAbout } from "@/utils/data-access/about";
import { AboutForm } from "./about-form";

export default async function AboutManager() {
  const about = await getAbout();
  const key = about?.updatedAt ?? "new";
  return <AboutForm key={key} about={about ?? undefined} />;
}
