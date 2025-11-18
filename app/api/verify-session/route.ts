import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/utils/firebase/admin";

const SESSION_COOKIE = "firebaseSession";

function getAllowedEmails(): string[] {
  const allowedEmails = process.env.ALLOWED_EMAILS;
  if (!allowedEmails) {
    return [];
  }
  return allowedEmails.split(",").map((email) => email.trim().toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );
      const userEmail = decodedClaims.email?.toLowerCase();

      if (!userEmail) {
        return NextResponse.json({ valid: false }, { status: 401 });
      }

      // Check if email is in allowed list
      const allowedEmails = getAllowedEmails();
      if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
        return NextResponse.json(
          { valid: false, reason: "email_not_allowed" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        valid: true,
        email: userEmail,
        uid: decodedClaims.uid,
      });
    } catch (error) {
      console.error("Session verification failed:", error);
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error) {
    console.error("Failed to verify session:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
