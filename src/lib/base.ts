export const SITE_BASE = import.meta.env.BASE_URL;

/** Prefix a root-absolute path with the deploy base (e.g. /portfolio). */
export const withBase = (path = "/") => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) return path;
  const base = SITE_BASE.replace(/\/+$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}` || "/";
};
