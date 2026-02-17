import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { appleNotificationSchema } from "@/lib/validation";

export const runtime = "nodejs";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const APPLE_NOTIFICATION_AUDIENCES = process.env.APPLE_NOTIFICATION_AUDIENCES
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

type AppleNotificationBody = {
  payload?: string;
  signedPayload?: string;
};

function getEventType(payload: JWTPayload) {
  if (typeof payload.notificationType === "string") return payload.notificationType;
  if (payload.events && typeof payload.events === "object") {
    const keys = Object.keys(payload.events as Record<string, unknown>);
    return keys[0] || "unknown";
  }
  return "unknown";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/apple/server-to-server-notifications",
    message: "Apple server-to-server notification endpoint is active",
  });
}

export async function POST(req: Request) {
  let body: AppleNotificationBody | null = null;
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      body = (await req.json()) as AppleNotificationBody;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = {
        payload: typeof form.get("payload") === "string" ? (form.get("payload") as string) : undefined,
        signedPayload:
          typeof form.get("signedPayload") === "string" ? (form.get("signedPayload") as string) : undefined,
      };
    } else {
      const rawText = await req.text();
      if (rawText) {
        body = JSON.parse(rawText) as AppleNotificationBody;
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body?.signedPayload || body?.payload;
  const parsedBody = appleNotificationSchema.safeParse(body || {});
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
  }
  const tokenFromSchema = parsedBody.data.signedPayload || parsedBody.data.payload;
  const effectiveToken = tokenFromSchema || token;
  if (!effectiveToken) {
    return NextResponse.json(
      { error: "Missing signed payload. Expected 'signedPayload' or 'payload'." },
      { status: 400 }
    );
  }

  try {
    const { payload } = await jwtVerify(effectiveToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience: APPLE_NOTIFICATION_AUDIENCES?.length ? APPLE_NOTIFICATION_AUDIENCES : undefined,
    });

    const eventType = getEventType(payload);
    const sub = typeof payload.sub === "string" ? payload.sub : null;

    console.info("[Apple S2S] Notification received", {
      eventType,
      sub,
      iat: payload.iat,
      iss: payload.iss,
    });

    return NextResponse.json({ ok: true, received: true, eventType });
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }
}
