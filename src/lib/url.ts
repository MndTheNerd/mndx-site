/**
 * Joins a base path and a site-relative path with exactly one slash between them.
 * Pure so it can be tested without Astro's env; use `withBase` in components.
 */
export function joinBase(base: string, path: string): string {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${trimmedBase}/${trimmedPath}`;
}

/** A site-relative URL that works under `/mndx-site/` on Pages and at a root domain later. */
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}
