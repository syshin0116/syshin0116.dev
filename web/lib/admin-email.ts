export function isAdminEmail(
  email: string | null | undefined,
  configured = process.env.AUTH_ADMIN_EMAILS ?? ""
): boolean {
  if (!email) return false
  const admins = new Set(
    configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  )
  return admins.has(email.toLowerCase())
}
