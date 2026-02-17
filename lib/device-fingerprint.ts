function normalizeIp(ip: string | null) {
  if (!ip) return "ip:none";
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.\d+$/);
  if (v4) return `v4:${v4[1]}.${v4[2]}.${v4[3]}`;
  const v6 = ip.split(":").slice(0, 4).join(":");
  return `v6:${v6}`;
}

export function buildDeviceFingerprint(input: {
  userAgent: string;
  ip: string | null;
  lang: string | null;
}) {
  const stable = [input.userAgent || "ua:none", normalizeIp(input.ip), (input.lang || "lang:none").slice(0, 24)].join("|");
  let hash = 2166136261;
  for (let i = 0; i < stable.length; i += 1) {
    hash ^= stable.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fp_${(hash >>> 0).toString(16)}`;
}
