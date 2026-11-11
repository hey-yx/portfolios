import { withBase } from "./base";

interface ContentEntryRoute {
  id: string;
}

type ContentRouteBase = "articles" | "projects";

export const getContentEntrySlug = (entry: ContentEntryRoute) => entry.id;

export const getContentEntryRouteParams = (entry: ContentEntryRoute) => ({
  slug: getContentEntrySlug(entry),
});

export const getContentEntryPath = (base: ContentRouteBase, entry: ContentEntryRoute) =>
  withBase(`/${base}/${getContentEntrySlug(entry)}`);
