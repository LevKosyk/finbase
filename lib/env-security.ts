const BLOCKED_PUBLIC_KEYS = [
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_OPENAI_API_KEY",
  "NEXT_PUBLIC_OPENROUTER_API_KEY",
  "NEXT_PUBLIC_RESEND_API_KEY",
  "NEXT_PUBLIC_REDIS_URL",
];

let warned = false;

export function validateEnvironmentSecurity() {
  if (warned) return;
  warned = true;

  for (const key of BLOCKED_PUBLIC_KEYS) {
    if (process.env[key]) {
      console.warn(`[security] Remove sensitive key from public env: ${key}`);
    }
  }

  if (process.env.NODE_ENV === "production") {
    const requiredSecrets = [
      "APP_ENCRYPTION_KEY",
      "OPENROUTER_API_KEY",
      "RESEND_API_KEY",
      "REDIS_URL",
    ];
    for (const key of requiredSecrets) {
      if (!process.env[key]) {
        console.warn(`[security] Missing recommended secret in production: ${key}`);
      }
    }
  }
}
