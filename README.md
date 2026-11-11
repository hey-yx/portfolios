# portfolios

张永鑫的个人作品集。展示项目交付、技术文章、工作片段和联系方式。

技术栈：Astro、Tailwind CSS、DaisyUI、Bun。

## 核心技术点

- 用 Astro 静态生成站点，页面走文件路由，项目和文章走 Content Collections，构建时完成类型校验和内容校验。
- 用 Markdown / MDX 管理文章和项目复盘，支持数学公式、标题锚点、代码高亮和 Mermaid 图表。
- 用 Tailwind CSS + DaisyUI 搭建界面，保留浅色 / 黑色主题切换，主题偏好写入 `localStorage`，默认跟随系统。
- 用 `astro:assets` 处理站内图片，项目截图支持明暗主题图切换，图集页面在构建时按数据生成九宫格和分组展示。
- 用共享布局组件统一 SEO、Open Graph、侧边栏、页头、页脚和主题控制，保证各页面结构一致。
- 在构建期写入部署时间，用低透明度 `deploy` 角标展示，不依赖运行时接口。
- 用客户端脚本延迟加载 GitHub 贡献图，空闲时请求数据，失败时降级展示，不阻塞首屏内容。
- 用 Bun 管理依赖和构建流程，`bun run check` 做 Astro 类型检查，`bun run build` 输出静态文件。
- 用 Docker 多阶段构建产物，最终由 Nginx 托管 `dist/`，GitHub Actions 构建 `linux/amd64` 镜像并推送到 `docker.itcox.cn`，服务器拉取当前镜像后重建容器。

## 启动

```bash
bun install
bun run dev
```

## 验证

```bash
bun run check
bun run build
bun run preview
```

## 常改入口

- 站点信息：`src/config.ts`
- 页面：`src/pages/`
- 导航：`src/data/navigation.ts`
- 项目：`src/content/projects/`
- 文章：`src/content/articles/`
- 图集数据：`src/data/moments.ts`
- 图集图片：`src/assets/moments/`
- 通用图片：`src/assets/`、`public/`
- Astro 维护教程：`public/astro-tech-map/README.md`

## 内容发布

- 新增文章：在 `src/content/articles/` 新建 Markdown。
- 新增项目：在 `src/content/projects/` 新建 Markdown，详情页由 `detailPage` 控制。
- 文章正文图片：放到 `public/articles/`，用 `![](/articles/demo.webp)` 引用。
- 新增图集：图片放到 `src/assets/moments/`，标题、日期、说明和排序写进 `src/data/moments.ts`。

## 部署

推送到 `main` 后，GitHub Actions 会构建 `linux/amd64` 镜像，推送到 `docker.itcox.cn` 的当前 commit 标签和 `latest` 标签，再通过 SSH 进入服务器，删除旧容器和旧镜像，拉取当前 commit 镜像并重新启动容器。

部署流水线会把当前 UTC 时间写入 `DEPLOYED_AT` 构建参数，站点按北京时间显示低透明度 `deploy` 角标。

必填 Secrets：

- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`

可选配置：

- `SSH_PORT`：默认 `22`
- `DEPLOY_IMAGE_NAME`：默认 `portfolios`，需要命名空间时可设为 `namespace/portfolios`
- `DEPLOY_CONTAINER_NAME`：默认 `portfolios`
- `DEPLOY_PORT_MAPPING`：默认 `11002:80`
