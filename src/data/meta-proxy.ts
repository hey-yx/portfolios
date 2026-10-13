/**
 * 自建的元数据代理（Cloudflare Worker），部署在 meta.itcox.cn，
 * 源码见 cloudflare-worker/newtab-meta-proxy.js。
 *
 * 用于转发跨域抓取：new-tab 的站点图标/标题，以及首页的 GitHub 贡献图。
 * 换域名时只改这里。
 */
export const META_PROXY_ORIGIN = "https://meta.itcox.cn";

export const buildMetaProxyUrl = (targetUrl: string) =>
  `${META_PROXY_ORIGIN}/?url=${encodeURIComponent(targetUrl)}`;
