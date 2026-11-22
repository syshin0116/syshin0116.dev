/**
 * Canonical origin. Search engines, feeds and OG cards must all agree on this one.
 * The Vercel production domain serves as canonical until a custom domain is bought;
 * switching to it later is a change to this one constant.
 */
export const SITE_URL = "https://syshin0116.vercel.app"

/**
 * The origin RSS guids were minted on. Items are identified by guid, so existing
 * subscribers only keep their read state while the guid stays byte-identical to what
 * their reader already stored. Keep this a literal, independent of SITE_URL, so a
 * later canonical move cannot change it.
 */
export const LEGACY_FEED_ORIGIN = "https://syshin0116.vercel.app"
