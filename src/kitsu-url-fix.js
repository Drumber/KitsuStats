/**
 * Temporary fix for wrong domain in media URLs which are returned by algolia.
 * 
 * TODO: Remove this once Kitsu has fully migrated to the new domain.
 */
export function fixMediaUrl(url) {
  if (!url) {
    return url;
  }
  return url.replace("https://media.kitsu.io", "https://media.kitsu.app");
}