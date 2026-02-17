export async function captureError(error: unknown, context?: Record<string, unknown>) {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureException(error, {
      extra: context,
    });
  } catch {
    // Monitoring must not break app flows.
  }
}
