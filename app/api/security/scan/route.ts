import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  base64: z.string().trim().min(1),
});

const MAX_SCAN_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = await req.json();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const bytes = Buffer.from(parsed.data.base64, "base64");
  if (bytes.length > MAX_SCAN_BYTES) {
    return NextResponse.json({ error: "File too large for scan" }, { status: 413 });
  }

  const scannerUrl = process.env.CLAMAV_HTTP_URL;
  if (!scannerUrl) {
    return NextResponse.json({ ok: true, scanned: false, skipped: true });
  }

  try {
    const response = await fetch(scannerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Name": parsed.data.fileName,
        "X-File-Type": parsed.data.mimeType,
      },
      body: bytes,
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, scanned: true, error: "Scanner unavailable" }, { status: 502 });
    }
    const data = await response.json().catch(() => ({}));
    if (data?.infected) {
      return NextResponse.json({ ok: false, scanned: true, infected: true, malware: data?.malware || "unknown" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, scanned: true, infected: false });
  } catch {
    return NextResponse.json({ ok: false, scanned: true, error: "Scan failed" }, { status: 502 });
  }
}
