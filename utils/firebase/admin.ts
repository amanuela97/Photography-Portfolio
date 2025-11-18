// /utils/firebase/admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) {
    return undefined;
  }

  // Remove surrounding quotes if present (handles both single and double quotes)
  let formatted = key.trim();
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }

  // Handle JSON-escaped strings (if key was copied from JSON)
  // Replace JSON escape sequences
  formatted = formatted.replace(/\\"/g, '"');
  formatted = formatted.replace(/\\'/g, "'");

  // Handle different newline formats
  // First handle double-escaped newlines (\\n in string becomes \n)
  formatted = formatted.replace(/\\\\n/g, "\n");
  // Then handle single-escaped newlines (\n)
  formatted = formatted.replace(/\\n/g, "\n");
  // Handle Windows line endings
  formatted = formatted.replace(/\\r\\n/g, "\n");
  formatted = formatted.replace(/\\r/g, "\n");

  // Handle literal newline characters (if key was pasted with actual newlines)
  formatted = formatted.replace(/\r\n/g, "\n");
  formatted = formatted.replace(/\r/g, "\n");

  // Remove any extra whitespace at start/end
  formatted = formatted.trim();

  // Check if it already has BEGIN/END markers
  const hasBeginMarker = formatted.includes("-----BEGIN");
  const hasEndMarker = formatted.includes("-----END");

  if (!hasBeginMarker || !hasEndMarker) {
    // If missing markers, try to add them
    // Remove any existing partial markers first
    formatted = formatted.replace(/^-----BEGIN[^-]*-----/i, "");
    formatted = formatted.replace(/-----END[^-]*-----$/i, "");
    formatted = formatted.trim();

    // Add proper markers
    formatted = `-----BEGIN PRIVATE KEY-----\n${formatted}\n-----END PRIVATE KEY-----`;
  }

  // Clean up the key content - remove any spaces that shouldn't be there
  // Split by newlines, trim each line, and rejoin
  const lines = formatted.split("\n");
  const beginLine = lines[0];
  const endLine = lines[lines.length - 1];
  const keyContent = lines.slice(1, -1).join("").replace(/\s/g, "");

  // Reconstruct with proper line breaks (64 chars per line is standard for PEM)
  const keyLines: string[] = [];
  for (let i = 0; i < keyContent.length; i += 64) {
    keyLines.push(keyContent.slice(i, i + 64));
  }

  formatted = `${beginLine}\n${keyLines.join("\n")}\n${endLine}`;

  // Ensure there are no double newlines
  formatted = formatted.replace(/\n\n+/g, "\n");

  // Final validation
  if (
    !formatted.match(
      /-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----/
    )
  ) {
    console.error("Private key format validation failed. Key structure:", {
      hasBegin: formatted.includes("-----BEGIN"),
      hasEnd: formatted.includes("-----END"),
      length: formatted.length,
      firstChars: formatted.substring(0, 50),
      lastChars: formatted.substring(formatted.length - 50),
      lineCount: formatted.split("\n").length,
    });
    throw new Error("Invalid private key format: missing BEGIN or END markers");
  }

  return formatted;
}

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin environment variables:");
    console.error("FIREBASE_PROJECT_ID:", projectId ? "✓" : "✗");
    console.error("FIREBASE_CLIENT_EMAIL:", clientEmail ? "✓" : "✗");
    console.error("FIREBASE_PRIVATE_KEY:", privateKey ? "✓" : "✗");
    throw new Error(
      "Firebase Admin credentials are missing. Please check your environment variables."
    );
  }

  // Debug: Log key format info (safely, without exposing the full key)
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
  console.log("Private key format debug:", {
    rawLength: rawKey.length,
    formattedLength: privateKey.length,
    hasBeginMarker: privateKey.includes("-----BEGIN"),
    hasEndMarker: privateKey.includes("-----END"),
    firstLine: privateKey.split("\n")[0],
    lastLine: privateKey.split("\n").slice(-1)[0],
    lineCount: privateKey.split("\n").length,
  });

  try {
    const appOptions: {
      credential: ReturnType<typeof cert>;
      storageBucket?: string;
    } = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    };

    // Only add storageBucket if it's provided
    if (storageBucket) {
      appOptions.storageBucket = storageBucket;
    }

    initializeApp(appOptions);
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("PEM")) {
      console.error("\n=== PEM Format Error Debug ===");
      console.error("The private key format is invalid. Common issues:");
      console.error(
        "1. Key should include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----"
      );
      console.error("2. Newlines should be escaped as \\n in .env file");
      console.error(
        "3. Key should be on a single line in .env file (with \\n for line breaks)"
      );
      console.error(
        "4. Make sure there are no extra spaces or quotes around the key"
      );
      console.error("\nExample format in .env.local:");
      console.error(
        'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----"'
      );
    }
    throw error;
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Only export storage if bucket is configured
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
export const adminStorage = storageBucket
  ? getStorage().bucket(storageBucket)
  : null;
