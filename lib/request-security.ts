import { hashString } from "@/lib/security";

function readCookie(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  const chunks = cookieHeader.split(";").map((part) => part.trim());
  for (const chunk of chunks) {
    if (!chunk.startsWith(`${name}=`)) continue;
    return decodeURIComponent(chunk.slice(name.length + 1));
  }
  return "";
}

export function getRequestContext(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const explicitDeviceId = req.headers.get("x-device-id") || "";
  const cookieDeviceId = readCookie(req, "fin_device_id") || readCookie(req, "fin_guest_ai_device") || "";
  const deviceSeed = explicitDeviceId || cookieDeviceId || `${ip}|${userAgent}`;
  const deviceFingerprint = hashString(deviceSeed);

  return {
    ip,
    userAgent,
    deviceFingerprint,
  };
}
