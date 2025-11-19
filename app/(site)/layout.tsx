import type { ReactNode } from "react";
import { Navbar } from "./components/navbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
