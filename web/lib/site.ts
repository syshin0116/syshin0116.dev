/** Canonical origin. Search engines, feeds and OG cards must all agree on this one. */
export const SITE_URL = "https://syshin0116.dev"

/**
 * The origin the feed used before the move to the canonical domain. RSS items are
 * identified by guid, so existing subscribers only keep their read state while the
 * guid stays byte-identical to what their reader already stored.
 */
export const LEGACY_FEED_ORIGIN = "https://syshin0116.vercel.app"
