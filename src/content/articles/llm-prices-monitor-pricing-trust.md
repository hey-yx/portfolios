---
title: "中转站价格监控怎么保证价格可信"
description: "一个价格从接口响应变成页面数字，要过公式计算、官方基准、合理性校验和虚假分组识别四道关，每条数据带来源链接。"
publishedDate: "2026-11-11"
tags:
  - "LLM"
  - "数据"
---

价格可信要满足三个条件：算价过程可以复现，比较基准来自厂商自己公布的价目，每条数字能点回原始响应。llmprices.cn 把这三件事分别落在 `llm_price_monitor/tracker.py` 的公式、`catalog/` 下的官方目录、以及带哈希的证据链上。下面按数据流走一遍。

## 算价走公式，倍率逐层扣清

new-api / one-api 的价格接口给的是倍率，单价要自己算。`newapi_price_record` 按 `输入价 = model_ratio × 基准价 × group_ratio` 计算，输出价同理，`tiered_expr` 与 `pricing_rules.tiers` 解析成完整上下文阶梯，缓存读写价单独保留。

真正的难点是「基准价」这一项。v1 载荷不声明计价单位，各站充值汇率能差 7 倍。采集时额外读站点 `/api/status`，用 `price`（充值汇率）和 `quota_per_unit` 推导 `ratio_base_price = 1e6 / quota_per_unit × price`，结果落在 0.5 到 50 之外就丢弃，读不到回退默认 2 并在任务日志留痕。`usd_exchange_rate` 只做前端显示换算，不能当基准：1-cnmz 报 7.3，实际按 1 收款。AIHub365 按 6.8 元卖一美元额度，拿默认 ¥2 算会把整站价格低估 6.8 倍，与站方自己标的「官方 3 折」对不上；换成 `/api/status` 推导值后，倍率乘 13.6 才精确命中。`billing_denomination_version: 2` 的新载荷直接读站方标注价，USD 基准乘站点给的 `pricing_cny_rate`，站点没给汇率就按 USD 输出，不伪造人民币单价。`model_ratio = 0` 在 new-api 里表示该模型未定价，跳过，不当免费。

另外两种载荷形态要提前拦。站点在 `group_prices` 里按分组给出算好的实付单价时，走 `group_price_map_records`，必须排在倍率分支之前：infistar 的 step-5-preview 显式价是 ¥5.8125，倍率折算只有 ¥1.04，差 5.6 倍。页面把官方参考价划删除线、旁边写实收价的站（heyroute 型），标准公式拿到的恰好是被划掉的那列，整站会偏高 2 到 50 倍；这类站靠三个特征识别，每格两个数、分组徽标写 `≈X% of official price`、`/api/pricing` 顶层带 `display_prices` 字段。

## 基准价只认厂商自己的价目

官方列表价来自 models.dev 的 `api.json`，Cloudflare CDN 分发，不需要密钥，每 24 小时同步一次。目录只收七家白名单厂商的国际站条目，OpenAI、Anthropic、Google、xAI、Zhipu AI、Moonshot AI、Alibaba Cloud；带 `-cn` 后缀的国内渠道条目全部剔除，原因是它缺时段分档，价格还是第三方汇率换算的，实测与官方人民币标价偏差不小。

国内厂商的基准价另走管理台「厂商定价源」，只填厂商名和公开定价页 URL。「立即抓取」复用 `price-page` 的解析顺序：Markdown 表格、HTML 表格、JSON 或压缩 JS 价格表，任一命中即停，AI 只在最后兜底并标 `candidate`。合并时 `region: cn` 的源把命中条目基准换成页面价，原国际价退到 `list_global` 作参考；`region: global` 的源只补参考价，不动基准。定价页上代售别家模型的条目按品牌归属校验拦在官方目录外，千帆挂的 DeepSeek 不能给 DeepSeek 定价。

定价页进目录前自己还要过两道：`_price_order_violation` 检查缓存读价不高于输入价、输入价不高于输出价，违反就判列错位；`_source_deviation_violation` 拿页面价与目录现值比，偏差超出 0.01 到 20 倍判为提取事故，保留原基准。后一道对 `candidate` 基准不设防，免得上一轮的错值把纠错通道锁死。

折扣率 = 站点价（CNY）÷ 官方列表价（CNY）。汇率在分子分母同时出现，比值与用哪套汇率标准无关。

## 虚假分组和倍率渠道

站点价与厂商价的比值落在 0.01 到 20 之外，`sanity_violation` 返回越界原因。结构化直采的行下界放宽到 1e-4，显式价直采的上界放宽到 500，这类行数值直接来自接口字段，只剩单位换算风险；页面文本和 AI 提取的行维持严格档。判出异常不立刻作废：`_apply_price_sanity` 首轮只在 `metadata.sanity_suspect` 挂标记，价格照常展示，下一轮同因复现才清空价格、转 `unavailable`。官方目录本身也可能错，单轮越界就作废会误杀真数据，AIHub365 就吃过这个亏。

虚假分组用 `_drop_phony_group_records` 判，需要两个信号同时成立：组内至少 2 个有价模型的价目完全相同，且组内已有模型被合理性校验作废过。2000lab 的「deepseek稳定高速」组是原型，5 个模型同一个 0.03 / 0.12 价目，前台并不售卖。只满足第一条不够，全库有 17 个组组内同价，grok 官方同价打包卖是真实形态；只看越界也不够，0.03 对官方 2.0 是 0.015 倍，还落在界内。单模型组一律不判，否则该组作废后站方改价也无法恢复。被跳过的组按本轮无数据处理，连续三轮缺失走 `GROUP_REMOVED_MISSES = 3` 移除旧价，站方改价后自动恢复采集。

渠道倍率型站点由 `_channel_rate_records` 补。价格链路一条都没命中，而状态快照 `status_ref:{site}` 里的渠道带 `rate_multiplier` 与 `primary_model` 时，按「实付 = 官方价 × 渠道倍率」合成价格，分组名取渠道名，整批标 `candidate` 待复核，官方目录查不到基准价的渠道直接跳过。1for 的售卖接口只剩订阅套餐，ChatGPT、Claude、Grok 三组倍率价目挂在渠道状态页上，靠这条路径才拿到。

## 采不到就标采不到

每个响应都进证据链，记脱敏后的 URL、状态码、内容 sha256，Authorization 与 Cookie 自动抹掉。价格记录带 `source_url`，官方条目带厂商文档链接，页面上点开就是当时的价目页。

`_has_price` 规定 0 / 0 双零只在 `price_status = confirmed` 时算有价。AI 抽不到价时可能把提示词模板里的示例值 0 抄进结果，这种占位行一旦入库，会以 ¥0 假免费价进快照并被首页最低价挑中。价格状态分 `confirmed`、`candidate`、`rule_only`、`unavailable` 四档，推算价单独标，需要登录的标 `requires_auth`。变化事件的指纹只含单价、缓存价、计费规则数值、币种、状态、认证，AI 每轮会漂移的上下文边界不参与，价格没变就不会报成变了。
