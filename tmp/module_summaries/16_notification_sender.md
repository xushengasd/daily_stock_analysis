# 模块：src/notification_sender

## 模块功能摘要

多渠道通知发送器目录。统一模式为构造 Sender 时传入配置，从配置读取 token/webhook/邮箱/目标 ID，对外提供 `send_to_xxx(...) -> bool`，成功返回 `True`，失败或配置缺失返回 `False`。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `email_sender.py` | SMTP 邮件发送，Markdown 转 HTML，股票分组收件人。 |
| `telegram_sender.py` | Telegram Bot API 发送，支持分段和 thread。 |
| `feishu_sender.py` | 飞书 webhook/app bot、卡片、分段、文件上传。 |
| `wechat_sender.py` | 企业微信/微信 webhook，文本和图片 payload。 |
| `dingtalk_sender.py` | 钉钉 webhook 发送。 |
| `discord_sender.py` | Discord webhook/bot 发送，rate limit retry。 |
| `slack_sender.py` | Slack webhook/bot blocks 和图片上传。 |
| `gotify_sender.py` | Gotify endpoint 解析和消息发送。 |
| `ntfy_sender.py` | ntfy endpoint/topic 解析和消息发送。 |
| `pushplus_sender.py` | Pushplus API 发送。 |
| `pushover_sender.py` | Pushover API 发送。 |
| `serverchan3_sender.py` | Server 酱发送。 |
| `custom_webhook_sender.py` | 自定义 webhook payload 模板和测试。 |
| `astrbot_sender.py` | AstrBot 服务发送。 |

## 主要接口与出入参说明

### 通用 Sender 模式

- 初始化输入：`Config`，包含渠道 token、webhook、目标 ID、邮箱、超时等。
- 发送输入：`content`，可选标题、接收人、线程 ID、超时。
- 输出：`bool` 表示成功/失败。
- 副作用：HTTP/SMTP 请求、文件/图片上传、长消息分段、日志记录。

### Email

- `get_receivers_for_stocks(stock_codes)`：输入股票代码列表，输出股票分组匹配后的收件人；无匹配返回默认收件人。
- `get_all_email_receivers()`：输出所有默认和分组邮箱去重合集。
- `send_to_email(content, subject=None, receivers=None, timeout_seconds=None)`：发送 multipart plain/html 邮件。
- 副作用：Markdown 转 HTML、SMTP 登录和发送。

### Telegram

- `send_to_telegram(content, chat_id=None, message_thread_id=None, timeout_seconds=None)`。
- 输入：Markdown 内容、可覆盖 chat/thread、超时。
- 输出：是否成功。
- 副作用：请求 Telegram Bot API，超过限制时分段，失败可纯文本 fallback。

### Feishu

- `send_to_feishu(content, timeout_seconds=None)`：通过 webhook 或 app bot 发送文本/卡片。
- `send_feishu_file(file_path)`：上传并发送文件。
- 副作用：安全字段、关键词前缀、长消息分段、文件上传。

### WeChat / DingTalk / Discord / Slack

- `send_to_wechat(content, timeout_seconds=None)`：企业微信/微信 webhook，支持长内容分段和图片内部接口。
- `send_to_dingtalk(content, title='', timeout_seconds=10)`：钉钉 webhook。
- `send_to_discord(content, timeout_seconds=None)`：Discord webhook/bot，支持分段和 rate limit retry。
- `send_to_slack(content, timeout_seconds=None)`：Slack webhook/bot，构造 blocks，支持图片上传。

### Gotify / Ntfy

- `resolve_gotify_message_endpoint(gotify_url)`：输入 Gotify URL，输出 message endpoint。
- `send_to_gotify(...)`：发送 Gotify 消息。
- `resolve_ntfy_endpoint(ntfy_url)`：输出 `(endpoint, topic)`。
- `send_to_ntfy(...)`：发送 ntfy 消息。

### Pushplus / Pushover / ServerChan3 / AstrBot

- `send_to_pushplus(...)`：输入内容、标题、模板等，调用 Pushplus API。
- `send_to_pushover(...)`：输入内容、标题、优先级等，调用 Pushover API。
- `send_to_serverchan3(...)`：输入内容、标题、SendKey，调用 Server 酱。
- `send_to_astrbot(content, timeout_seconds=None)`：调用 AstrBot 服务。

### Custom Webhook

- `send_to_custom(content)`：按配置模板构造 payload 并发送。
- `test_custom_webhooks(content, timeout_seconds=20.0)`：输出各 webhook 测试结果列表。
- 副作用：HTTP POST；针对钉钉/Discord 等做特殊 payload 处理；支持图片 webhook 内部发送。

## 关联模块

- 被调用：`src/core/pipeline.py`、`src/services/system_config_service.py`、告警 worker、Bot/分析通知流程。
- 依赖：配置中的渠道凭据和 webhook；外部通知平台。
