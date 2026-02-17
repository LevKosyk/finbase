# Security Keys and Rotation

## Rules
- Keep all secrets in server env or secret manager.
- Never expose secret values with `NEXT_PUBLIC_*`.
- Rotate keys immediately after suspected leak.

## Rotation Checklist
1. `SUPABASE_SERVICE_ROLE_KEY`: rotate in Supabase dashboard, update env, redeploy.
2. `OPENROUTER_API_KEY` / `OPENAI_API_KEY`: rotate in provider console, update env, redeploy.
3. `RESEND_API_KEY`: rotate in Resend dashboard, update env, redeploy.
4. `REDIS_URL`: rotate credentials/ACL, update env, redeploy.
5. `APP_ENCRYPTION_KEY`: rotate carefully with data re-encryption plan.

## Post-Rotation Validation
- Login + 2FA flow works.
- Export/documents endpoints work.
- AI endpoint works.
- Email reminders work.
- Redis cache reads/writes work.
