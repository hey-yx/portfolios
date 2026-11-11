# 06. Head、SEO 与站点元信息

## 相关文件

- `src/components/BaseHead.astro`
- `src/layouts/BaseLayout.astro`
- `src/config.ts`
- `public/social_img.webp`
- `public/favicon-32x32.png`
- `public/favicon-192x192.png`
- `public/apple-touch-icon.png`

## 为什么单独做 BaseHead

每个页面都需要：

- title
- description
- viewport
- favicon
- Open Graph
- canonical
- 站点作者与基础信息

如果每个页面都写一遍，后期很容易不一致。

这个项目把它集中到：

```text
src/components/BaseHead.astro
```

## BaseHead 接收什么

```ts
export interface Props {
  title: string;
  description: string;
  image?: string | ImageMetadata;
  ogType?: string;
}
```

页面通过 `BaseLayout` 间接传入：

```astro
<BaseLayout
  title={article.title}
  description={article.description}
  image={article.heroImage}
  ogType="article"
>
```

## 页面标题怎么拼

`BaseHead.astro`：

```ts
const pageTitle = title === SITE_TITLE ? title : `${title} | ${SITE_TITLE}`;
```

效果：

```text
首页：张永鑫
文章页：文章 | 张永鑫
文章详情：从这里开始记录 | 张永鑫
```

这是一种常见做法：详情页标题在前，站点名在后。

## 默认分享图

```ts
const { title, description, image = "/social_img.webp", ogType = "website" } = Astro.props;
```

如果页面没有传 `image`，默认用：

```text
public/social_img.webp
```

文章或项目有头图时，可以覆盖：

```astro
image={article.heroImage}
```

## Astro.url 的作用

```astro
<meta property="og:url" content={Astro.url} />
```

`Astro.url` 是当前页面的 URL 对象。

用它生成图片绝对地址：

```astro
const socialImageUrl = typeof socialImage === "string"
  ? new URL(socialImage, Astro.url).toString()
  : new URL(socialImage.src, Astro.url).toString();

<meta property="og:image" content={socialImageUrl} />
```

如果 `image` 是：

```text
/social_img.webp
```

就可以变成完整地址：

```text
https://your-domain.com/social_img.webp
```

如果 `image` 是从 `src/assets` 导入的图片对象，就取它的 `.src` 再转成绝对地址。

## Open Graph 是什么

这些 meta 会影响链接分享效果：

```html
<meta property="og:type" content="website" />
<meta property="og:url" content="..." />
<meta property="og:site_name" content="..." />
<meta property="og:locale" content="zh_CN" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
```

常见展示场景：

- 微信聊天卡片。
- 飞书/Slack 链接预览。
- Notion 粘贴链接预览。

## 站点基础信息

```html
<link rel="canonical" href="..." />
<meta name="author" content="张永鑫" />
<meta name="application-name" content="张永鑫" />
<meta name="robots" content="index,follow" />
```

这些信息让搜索引擎、链接预览和浏览器都能读到清晰的站点归属。

## favicon 和 touch icon

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

这些文件在 `public/` 下，所以可以直接用根路径访问。

## 和 Content Collections 的关系

文章 frontmatter：

```yaml
title: "从这里开始记录"
description: "给想法、复盘和阶段性判断留一个正式入口。"
heroImage: "/projects/sxeasy/home.webp"
```

详情页：

```astro
<BaseLayout
  title={article.title}
  description={article.description}
  image={article.heroImage}
  ogType="article"
>
```

这让文章数据同时服务于：

- 页面正文。
- 浏览器标题。
- 搜索摘要。
- 社交分享卡片。

## 可以动手试的事

1. 修改一篇文章的 `description`。
2. 打开构建后的 HTML。
3. 搜索 `<meta name="description"`。
4. 确认 meta 内容跟 frontmatter 一致。
5. 给文章加 `heroImage`，确认 `og:image` 变化。

## 这一节要掌握的关键词

- `<head>`
- `BaseHead`
- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `Astro.url`
- Open Graph
- canonical
- author
- favicon
- meta description
