"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProfileDocument } from "@/utils/types";

const SiteProfileContext = createContext<ProfileDocument | null>(null);

interface SiteProfileProviderProps {
  profile: ProfileDocument | null;
  children: ReactNode;
}

export function SiteProfileProvider({
  profile,
  children,
}: SiteProfileProviderProps) {
  return (
    <SiteProfileContext.Provider value={profile}>
      {children}
    </SiteProfileContext.Provider>
  );
}

export function useSiteProfile() {
  return useContext(SiteProfileContext);
}
