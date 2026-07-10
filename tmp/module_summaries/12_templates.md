# 模块：templates

## 模块功能摘要

Jinja2 报告模板目录，将结构化分析结果渲染为 Markdown 完整报告、微信/通知精简报告、Brief 摘要报告和公共宏。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `report_markdown.j2` | 完整 Markdown 分析报告。 |
| `report_wechat.j2` | 微信/通知渠道精简报告。 |
| `report_brief.j2` | 极简摘要报告。 |
| `_macros.j2` | 公共宏，如市场快照表格。 |

## 模板输入数据

通用上下文变量：

- `report_date` / `report_timestamp`：报告日期和时间。
- `labels`：本地化文案字典。
- `results`：原始分析结果列表。
- `enriched`：增强结果列表，含本地化建议、信号图标等。
- `buy_count` / `hold_count` / `sell_count`：信号计数。
- `market_status_line`：市场状态摘要。
- `summary_only`：是否只输出摘要。
- `show_llm_model` / `models_used`：模型展示开关和模型列表。
- `report_language`：报告语言。

单个 `enriched` item 常用字段：`stock_name`、`signal_emoji`、`signal_text`、`localized_operation_advice`、`localized_trend_prediction`、`result`。

`result` 常用字段：`code`、`sentiment_score`、`trend_prediction`、`operation_advice`、`analysis_summary`、`dashboard`、`market_snapshot`。

## 主要接口与出入参说明

### `report_markdown.j2`

- 输入：完整 `enriched`、`labels`、dashboard、辅助函数。
- 输出：包含汇总、单股详细分析、情报、核心结论、行情快照、数据视角、阶段决策、作战计划的 Markdown。
- 副作用：模板自身无副作用。

### `report_wechat.j2`

- 输入：与完整报告类似，额外受 `summary_only` 控制。
- 输出：更短的 Markdown 风格通知文本，截断过长新闻/风险/催化/买点等字段。

### `report_brief.j2`

- 输入：日期、计数、`enriched` 列表、模型信息。
- 输出：一屏式摘要报告。

### `_macros.j2`

- `market_snapshot(result)`：输入单个分析结果，读取 `result.market_snapshot`，输出行情快照 Markdown 表格。

## 关联模块

- 被调用：`src/services/report_renderer.py`、通知发送流程、历史 Markdown 报告生成。
- 依赖：`src/schemas/report_schema.py` 定义的 dashboard 结构。
