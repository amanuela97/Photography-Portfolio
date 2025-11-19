"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/utils/firebase/client";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const SESSION_ENDPOINT = "/api/session";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectDestination = useMemo(
    () => getRedirectDestination(searchParams),
    [searchParams]
  );
  const [isLoading, setIsLoading] = useState(false);
  const hasSyncedSessionRef = useRef(false);
  const unauthorizedToastShownRef = useRef(false);
  const successToastShownRef = useRef(false);

  const persistSession = useCallback(async (user: User, showToast = true) => {
    const idToken = await user.getIdToken();
    const response = await fetch(SESSION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorData;

      if (contentType && contentType.includes("application/json")) {
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          throw new Error(
            `Unable to persist session: ${response.status} ${response.statusText}`
          );
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON error response:", text);
        throw new Error(
          `Unable to persist session: ${response.status} ${response.statusText}`
        );
      }

      if (errorData?.reason === "email_not_allowed") {
        await signOut(auth);
        if (showToast && !unauthorizedToastShownRef.current) {
          unauthorizedToastShownRef.current = true;
          toast.error(
            "Unauthorized: Your email is not authorized to access this portal."
          );
        }
        throw new Error("Email not allowed");
      }

      throw new Error(errorData?.error || "Unable to persist session");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || hasSyncedSessionRef.current) {
        if (!firebaseUser) {
          unauthorizedToastShownRef.current = false;
          successToastShownRef.current = false;
        }
        return;
      }
      try {
        await persistSession(firebaseUser, false);
        hasSyncedSessionRef.current = true;
        if (!successToastShownRef.current) {
          successToastShownRef.current = true;
          toast.success("Successfully signed in!");
        }
        router.replace(redirectDestination);
      } catch (error) {
        console.error("Failed to refresh session", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes("Email not allowed") &&
          !unauthorizedToastShownRef.current
        ) {
          unauthorizedToastShownRef.current = true;
          toast.error(
            "Unauthorized: Your email is not authorized to access this portal."
          );
        }
      }
    });
    return unsubscribe;
  }, [persistSession, redirectDestination, router]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    unauthorizedToastShownRef.current = false;
    successToastShownRef.current = false;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await persistSession(result.user, true);
      if (!unauthorizedToastShownRef.current) {
        successToastShownRef.current = true;
        toast.success("Successfully signed in!");
        router.replace(redirectDestination);
      }
    } catch (error) {
      console.error("Google sign-in failed", error);
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled. Please try again.");
      } else if (firebaseError.code === "auth/popup-blocked") {
        toast.error("Popup was blocked. Please allow popups and try again.");
      } else if (firebaseError.message?.includes("Email not allowed")) {
      } else if (!unauthorizedToastShownRef.current) {
        toast.error("Sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [persistSession, redirectDestination, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-brand-surface rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-brand-primary mb-2">
              Admin Portal
            </h1>
            <p className="text-brand-text text-base">
              Sign in to access the admin dashboard
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-6 px-4 rounded-lg bg-white text-gray-700 font-semibold text-base border border-gray-300 hover:bg-gray-50 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-brand-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-brand-surface rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-brand-primary mb-2">
                Admin Portal
              </h1>
              <p className="text-brand-text text-base">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </main>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

function getRedirectDestination(searchParams: ReadonlyURLSearchParams) {
  return searchParams.get("redirectTo") ?? "/admin";
}

