import crypto from "node:crypto";

function resolveKey() {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) return null;

  const trimmed = raw.trim();
  try {
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, "hex");
    }
    const buf = Buffer.from(trimmed, "base64");
    if (buf.length === 32) return buf;
  } catch {
    return null;
  }
  return null;
}

export function encryptText(plain: string) {
  const key = resolveKey();
  if (!key) throw new Error("APP_ENCRYPTION_KEY is missing or invalid.");

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptText(payload: string) {
  const key = resolveKey();
  if (!key) throw new Error("APP_ENCRYPTION_KEY is missing or invalid.");

  const [ivRaw, tagRaw, dataRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error("Invalid encrypted payload");

  const iv = Buffer.from(ivRaw, "base64");
  const tag = Buffer.from(tagRaw, "base64");
  const data = Buffer.from(dataRaw, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
