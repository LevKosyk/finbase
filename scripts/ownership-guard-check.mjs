#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app/actions", "app/api"];
const SENSITIVE_MODELS = [
  "income",
  "expense",
  "statementImport",
  "categorizationRule",
  "documentGeneration",
  "aIChatSession",
  "aIChatMessage",
  "trustedDevice",
  "session",
  "auditLog",
];
const ALLOWLIST = [
  { file: "app/api/ai/route.ts", model: "aIChatMessage", op: "findMany" },
  { file: "app/api/ai/route.ts", model: "aIChatSession", op: "update" },
  { file: "app/api/ai/sessions/[sessionId]/route.ts", model: "aIChatSession", op: "update" },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const issues = [];

for (const rel of TARGET_DIRS) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const files = walk(abs);

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const m = line.match(/prisma\.(\w+)\.(findMany|findFirst|findUnique|update|updateMany|delete|deleteMany|count|aggregate)\(/);
      if (!m) continue;
      const model = m[1];
      if (!SENSITIVE_MODELS.includes(model)) continue;

      const window = lines.slice(i, Math.min(lines.length, i + 80)).join("\n");
      const hasUserFilter =
        /userId\s*:/.test(window) ||
        /where:\s*\{[^}]*\buserId\b/.test(window) ||
        /where:\s*\{\s*id\s*,\s*userId\s*:/.test(window) ||
        /where:\s*\{\s*id\s*:\s*current\.id/.test(window);
      const adminAllowed = /requireAdmin\(|auth\.ok/.test(text);

      if (!hasUserFilter && !adminAllowed) {
        const relative = path.relative(ROOT, file);
        const allowed = ALLOWLIST.some(
          (item) => item.file === relative && item.model === model && item.op === m[2]
        );
        if (allowed) continue;
        issues.push({ file: path.relative(ROOT, file), line: i + 1, model, op: m[2] });
      }
    }
  }
}

if (issues.length > 0) {
  console.error("Ownership guard check failed:\n");
  for (const issue of issues) {
    console.error(`- ${issue.file}:${issue.line} prisma.${issue.model}.${issue.op}() without userId guard`);
  }
  process.exit(1);
}

console.log("Ownership guard check passed");
