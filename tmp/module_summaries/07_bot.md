# 模块：bot

## 模块功能摘要

多平台机器人适配层，接收飞书、钉钉、企业微信、Telegram、Discord 等 webhook/stream 消息，转为统一 `BotMessage`，经 `CommandDispatcher` 分发命令，再将 `BotResponse` 转回平台响应。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `models.py` | `BotMessage`、`BotResponse`、`WebhookResponse`、平台和聊天类型模型。 |
| `handler.py` | webhook 统一入口和平台快捷入口。 |
| `dispatcher.py` | 命令注册、限流、鉴权、同步/异步分发。 |
| `commands/base.py` | 命令基类。 |
| `commands/*.py` | 分析、批量、大盘、状态、历史、策略、帮助、聊天、问答、研究命令。 |
| `platforms/base.py` | 平台适配基类。 |
| `platforms/*.py` | 飞书/钉钉/Discord 等平台适配。 |

## 主要接口与出入参说明

### `BotMessage`

- 输入字段：平台、消息 ID、用户、聊天 ID/类型、正文、原始内容、提及信息、时间戳、原始 payload。
- `get_command_and_args(prefix='/')`：输出 `(command, args)`，支持中文命令映射。
- `is_command(prefix='/')`：输出是否为命令。

### `BotResponse`

- 输入字段：文本、Markdown、是否 @ 用户、回复消息 ID、额外字段。
- 构造器：`text_response()`、`markdown_response()`、`error_response()`。
- 输出：统一机器人响应对象。

### `WebhookResponse`

- 输入字段：状态码、body、headers。
- 构造器：`success()`、`challenge()`、`error()`。
- 输出：平台 webhook HTTP 响应。

### `handle_webhook(platform_name, headers, body, query_params=None)`

- 输入：平台名、HTTP headers、原始 body、查询参数。
- 输出：`WebhookResponse`。
- 副作用：解析平台消息；调用分发器；可能开启后台线程发送 follow-up；bot 关闭时直接成功返回。

### `CommandDispatcher`

- 初始化输入：命令前缀、限流次数/窗口、管理员用户。
- `register(command)` / `register_class(command_class)`：注册命令和别名。
- `dispatch(message)` / `dispatch_async(message)`：输入 `BotMessage`，输出 `BotResponse`。
- 副作用：限流记录、命令执行、可能触发分析/通知/查询。

### `BotCommand`

- 属性：`name`、`aliases`、`description`、`usage`、`hidden`、`admin_only`。
- `execute(message, args)` / `execute_async(message, args)`：输入消息和参数，输出 `BotResponse`。
- `validate_args(args)`：输出错误消息或 `None`。

## 关联模块

- 依赖：`src/services/`、`src/core/`、`src/agent/`、通知配置。
- 被调用：各平台 webhook、stream bot、部署入口。
