/**
 * Signed-in access is limited to AUTH_ALLOWED_EMAILS. Production fails closed
 * when the list is empty; local development and tests stay open.
 */
export function isAllowedEmail(
  email: string | null | undefined,
  configured = process.env.AUTH_ALLOWED_EMAILS ?? "",
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  if (!email) return false
  const allowed = new Set(
    configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  )
  if (allowed.size === 0) return nodeEnv !== "production"
  return allowed.has(email.toLowerCase())
}
