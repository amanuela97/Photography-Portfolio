"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase/client";
import { Button } from "@/components/ui/button";

const SESSION_ENDPOINT = "/api/session";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      await fetch(SESSION_ENDPOINT, { method: "DELETE" });
      router.replace("/login");
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-full bg-brand-primary text-brand-contrast transition duration-fast ease-in-out hover:bg-brand-accent hover:text-brand-primary cursor-pointer"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
