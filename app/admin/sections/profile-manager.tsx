import { getProfile } from "@/utils/data-access/profile";
import { ProfileForm } from "./profile-form";
import type { ReactElement } from "react";

export default async function ProfileManager(): Promise<ReactElement> {
  const profile = await getProfile();
  return <ProfileForm profile={profile ?? undefined} />;
}
