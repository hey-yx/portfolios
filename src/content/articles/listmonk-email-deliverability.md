---
title: "邮件群发的送达率和图片实战"
description: "listmonk 群发里 Gmail 不显示图片、Cloudflare 橙云 403、活动 API 状态机与 SPF/DKIM/DMARC 的排查记录"
publishedDate: "2026-11-11"
tags:
  - "邮件"
  - "运维"
---

Gmail 收件人看不到图片，先去看图片 URL 背后的 CDN 有没有海外节点，正文 HTML 一般没问题。脚本调 listmonk API 报 403，先看请求带的是什么 User-Agent。活动改不动、测试信发出来是空白的，多半卡在状态机或者请求体不完整。这三类问题在 2026 年 9 月集中出现过一次，下面按发生顺序写，域名、响应码和端点都保留原样。

## Gmail 不显示图片：两次排查

2026 年 9 月 15 日，活动发出后 Gmail 收件人反馈图片是空白，QQ 邮箱和企业微信正常。Gmail 会用自己的海外图片代理去抓邮件里的外链图片，抓不到就不显示。同一个 URL 在国内邮箱能出图，说明不了海外的情况。

第一轮定位到 IPv6。图片挂在阿里云 CDN 的 `cdn.itcox.cn` 上，这个加速域名的 IPv6 只在中国内地生效。Google 的图片代理在海外，优先走 IPv6，连不上也不回退到 IPv4，抓图就超时。在阿里云控制台关掉该域名的 IPv6，`dig cdn.itcox.cn AAAA` 确认没有记录，当天以为修好了。

第二天 Gmail 仍然不出图。这一轮实测出的原因更靠底层：那个阿里云 CDN 只有内地节点，海外 DNS 解析出来的全是内地运营商的 IP。从海外拉图，四分之一的概率 25 秒超时，成功的那部分也要 2 到 5 秒。试过套 Cloudflare 橙云，橙云回源阿里云走的还是同一条路，一样返回 522。

最终的解法是把图片搬进 Cloudflare 网络。先用 Workers 静态资产伺服，迁移后实测海外 7 个节点全通，0.2 到 0.7 秒；国内直连 1.3 到 4.5 秒，晚高峰走 CF 东京节点，比纯阿里云 CDN 慢。CF 免费版没有内地节点，这个代价换来的是 Gmail 稳定出图。

## 图片现在走媒体库

2026 年 9 月 16 日起，邮件图片统一用 listmonk 自带的媒体库。后台上传或者 `POST /api/media`，返回的 URL 形如 `https://listmonk.itcox.cn/uploads/<文件名>`。jpg 和 png 属于 Cloudflare 默认缓存的扩展名，边缘命中之后 Gmail 的代理基本秒取。冷抓图要回源腾讯云一次，图片本身只有几十到几百 KB，源站的国际连通性够用。

`cdn.itcox.cn` 随这次改动灰云还原成纯阿里云 CDN，视频等非邮件文件照旧走它，国内速度回到原来的水平。

9 月 12 日那封活动已经发出，正文改不了，里面的图片还指向 `cdn.itcox.cn`，灰云之后 Gmail 收件人看到的图时好时坏。这两张图是 `marketing/platform-h5-duo.jpg`（394KB）和 `marketing/wecom-qr.png`（48KB），9 月 18 日实测返回 200，字节数和原件一致，就没再动。

Worker 方案中间出过一次事故。当时给 `cdn.itcox.cn` 配路由，写成 `cdn.itcox.cn/*` 通配，把这个域名 OSS 上的视频一起挡成了 404，当天视频打不开。路由只能写精确路径，比如 `cdn.itcox.cn/marketing/新图.jpg`，非路由的路径靠自动穿透回源。

## 橙云之后脚本会被 403

`listmonk.itcox.cn` 开了 Cloudflare 橙云，用 Python 的 urllib 或 requests 按默认 UA 调 API，返回 403。curl 默认 UA 不受影响，所以同一个端点用 curl 通、用脚本不通，第一次遇到容易以为是服务挂了。

处理办法是给脚本设一个浏览器 UA，`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)` 这类就够。橙云按 UA 判断客户端类型，默认的 `Python-urllib/3.x` 和 `python-requests/2.x` 会撞上挑战页。

## 活动 API 的四个坑

活动的坑集中在状态机和请求体完整性上。

已发送完成的活动改不了，`PUT` 会返回 400 `Cannot update a running or a finished campaign`。一个活动只发一轮，完成后状态自动变 finished，要再发就新建一个，想改已发内容只能进数据库。

测试端点不读活动正文。`POST /api/campaigns/:id/test` 的请求体缺 `body`、`template_id`、`content_type`，渲染出来是空邮件；`from_email` 必须显式传，且和 SMTP 认证账号一致，传别的地址返回 501。我们的认证账号是 `service@htlabs.com.cn`。

启动发送没有 `/start` 端点，v6 已经移除。用 `PUT /api/campaigns/:id/status` 加 `{"status":"running"}`，暂停和取消分别是 `paused` 和 `cancelled`。照老版本文档写脚本会 404。

`PUT` 更新活动时 `lists` 必传。只传 `{"body": "..."}` 返回 400 `Invalid list IDs`。这个字段传进去就是全量替换，正确做法是先 GET 拿到完整的 id 数组，改完正文再原样回传。

## 认证、限速与信誉

这三条记录配在 Cloudflare 的 DNS 上，任何一条缺失都会影响进箱率。

SPF 原来只有 `include:_spf.mx.cloudflare.net`，漏了腾讯企业邮的授权。发信走的是 `smtp.exmail.qq.com:465`，SPF 里没有 `spf.mail.qq.com`，等于告诉收件方这批 IP 未获授权，Gmail 那边的域名信誉会掉。2026 年 9 月 15 日补上，现在是 `v=spf1 include:_spf.mx.cloudflare.net include:spf.mail.qq.com ~all`。

DKIM 的密钥在腾讯企业邮后台生成，selector 是 `ytjy2607`，DNS 里加一条 `ytjy2607._domainkey.itcox.cn` 的 TXT，同一天完成。DMARC 用 `p=none`，rua 报表指向 Cloudflare，先观察。等 DKIM 签名稳定一段时间再收紧到 quarantine。

还差一键退订。Gmail 对批量发件人要求 RFC 8058 的 `List-Unsubscribe` 和 `List-Unsubscribe-Post` 两个头，listmonk 支持在活动的 `headers` 字段里加，链接必须是 HTTPS，DKIM 签名要覆盖这两个头。正文里的 `{{ UnsubscribeURL }}` 照旧保留，两者不冲突。

日发 5000 封以上才触发 Gmail 和 Yahoo 的强制门槛，我们的量级远低于此，但上面这些配置决定邮件落到收件箱还是推广页。发送侧还有两道限速，`message_rate` 是 1 封/秒，滑动窗口每小时最多 220 封，它是上限刹车，实际发多少由启动的活动决定。新域名按每天 10 到 20 封起步预热，逐周往上加，突然放量基本会进垃圾箱。

发信用的腾讯企业邮也不是群发通道。公开资料给的额度大约每个账号每天 1000 封，单封最多 500 个收件人。量一大，最先出问题的地方通常是 SMTP 被限流、整个业务邮箱被冻结，进箱率还排在后面。真要上量，得换专门的发送服务或者配多个 SMTP 账号轮换。

信誉绑在域名和 IP 两张牌上。做过 DKIM 的邮件，Gmail 主要记域名信誉，域名坏了换 IP 基本没用；新 IP 零历史，上来就放量反而更可疑。垃圾投诉率的红线是 0.3%，长期建议压在 0.1% 以下。项目里还没接 Google Postmaster Tools，`itcox.cn` 的投诉数据现在看不到，这是下一个该补的口子。

## 一个容易误判的点

改完图片链路之后要拿新发的测试邮件去验证。Gmail 对已收邮件的图片有缓存，翻出旧邮件看还是空白，会让人以为修复没生效，第一次排查时就因为这个多绕了一轮。
