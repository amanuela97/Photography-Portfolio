import type { ReactNode } from "react";
import { Navbar } from "@/app/components/navbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
