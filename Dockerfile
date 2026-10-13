FROM --platform=$BUILDPLATFORM oven/bun:1.3.10-alpine AS builder

ARG BUILDPLATFORM
ENV ASTRO_TELEMETRY_DISABLED=1

# 境内构建时经 .env 的 ALPINE_MIRROR 换 apk 源，默认不动
ARG ALPINE_MIRROR=""

RUN if [ -n "$ALPINE_MIRROR" ]; then sed -i "s#https://dl-cdn.alpinelinux.org#${ALPINE_MIRROR}#g" /etc/apk/repositories; fi \
 && apk add --no-cache python3 make g++ nodejs npm

WORKDIR /app

# bun/npm 统一走 npmmirror。sharp 不单独装：astro 自带的 0.34 走 @img/* 预编译包，
# 纯 npm 依赖、不需要 node-gyp 编译，也不碰 GitHub releases（境内构建稳定）。
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run check && bun run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
