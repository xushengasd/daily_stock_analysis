# 模块摘要索引

> 本目录为临时分析产物，位于 `tmp/module_summaries/`，应由 `.gitignore` 中的 `tmp/` 忽略，不应提交到 Git。

## 全局架构摘要

- `api/` 提供 FastAPI HTTP 接口，调用 `src/services/` 业务服务。
- `apps/dsa-web/` 是 React 前端，`apps/dsa-desktop/` 是 Electron 桌面壳。
- `src/core/` 编排股票分析、大盘复盘、交易日历、配置 registry 与回测核心逻辑。
- `data_provider/` 封装多行情/基本面数据源，`src/data/` 提供股票索引和名称映射。
- `src/agent/` 提供工具调用、多 Agent 编排、研究、技能/策略路由。
- `src/llm/` 抽象文本生成后端、LiteLLM 参数治理、本地 CLI 后端与 usage/cache 统计。
- `src/services/` 是主要业务服务层，覆盖分析、历史、告警、组合、决策信号、配置、任务和情报。
- `src/repositories/` 是数据库访问层，`src/schemas/` 是核心领域数据契约。
- `src/notification_sender/` 封装多渠道通知发送。
- `bot/` 提供多平台机器人入口，`templates/` 渲染报告，`scripts/` 提供维护与数据生成脚本。

## 模块清单

| 文件 | 模块 | 状态 |
|---|---|---|
| `01_core.md` | `src/core/` | 已整理 |
| `02_data.md` | `src/data/` | 已整理 |
| `03_strategies.md` | `strategies/` | 已整理 |
| `04_data_provider.md` | `data_provider/` | 已整理 |
| `05_api.md` | `api/` | 已整理 |
| `06_apps.md` | `apps/` | 已整理 |
| `07_bot.md` | `bot/` | 已整理 |
| `08_scripts.md` | `scripts/` | 已整理 |
| `09_schemas.md` | `src/schemas/` | 已整理 |
| `10_repositories.md` | `src/repositories/` | 已整理 |
| `11_utils.md` | `src/utils/` | 已整理 |
| `12_templates.md` | `templates/` | 已整理 |
| `13_services.md` | `src/services/` | 已整理 |
| `14_agent.md` | `src/agent/` | 已整理 |
| `15_llm.md` | `src/llm/` | 已整理 |
| `16_notification_sender.md` | `src/notification_sender/` | 已整理 |
