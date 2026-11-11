import { withBase } from "../lib/base";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

export const primaryNavItems: NavItem[] = [
  {
    id: "home",
    label: "首页",
    href: withBase("/"),
  },
  {
    id: "projects",
    label: "项目",
    href: withBase("/projects"),
  },
  {
    id: "articles",
    label: "文章",
    href: withBase("/articles"),
  },
  {
    id: "moments",
    label: "图集",
    href: withBase("/moments"),
  },
];

export const actionNavItems: NavItem[] = [
  {
    id: "contact",
    label: "联系我",
    href: withBase("/contact"),
  },
];
