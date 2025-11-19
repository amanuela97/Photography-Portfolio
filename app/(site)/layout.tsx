import type { ReactNode } from "react";
import { Navbar } from "./components/navbar";
import { SiteProfileProvider } from "./components/site-profile-context";
import { getProfile } from "@/utils/data-access/profile";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();

  return (
    <SiteProfileProvider profile={profile}>
      <Navbar />
      {children}
    </SiteProfileProvider>
  );
}
