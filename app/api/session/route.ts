import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/utils/firebase/admin";

const SESSION_COOKIE = "firebaseSession";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

function getAllowedEmails(): string[] {
  const allowedEmails = process.env.ALLOWED_EMAILS;
  if (!allowedEmails) {
    return [];
  }
  return allowedEmails.split(",").map((email) => email.trim().toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    let idToken: string;
    try {
      const body = await request.json();
      idToken = body.idToken;
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userEmail = decodedToken.email?.toLowerCase();

      if (!userEmail) {
        return NextResponse.json(
          { error: "Email not found in token" },
          { status: 401 }
        );
      }

      // Check if email is in allowed list
      const allowedEmails = getAllowedEmails();
      if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
        return NextResponse.json(
          { error: "Unauthorized", reason: "email_not_allowed" },
          { status: 403 }
        );
      }

      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_MAX_AGE * 1000,
      });

      const response = NextResponse.json({ status: "created" });
      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionCookie,
        maxAge: SESSION_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return response;
    } catch (authError) {
      console.error("Firebase auth error:", authError);

      const firebaseError = authError as { code?: string; message?: string };

      // Handle specific Firebase auth errors
      if (firebaseError.code === "auth/argument-error") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      return NextResponse.json(
        {
          error: "Unauthorized",
          details: firebaseError.message || "Authentication failed",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Failed to create session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "cleared" });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
