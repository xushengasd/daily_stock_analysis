# 模块：src/core

## 模块功能摘要

核心业务编排层，负责股票分析流水线、大盘复盘、配置元数据、交易日历、市场画像、策略蓝图、回测评估与复盘运行锁。它主要协调 `data_provider/`、`src/services/`、LLM 分析器、通知服务和持久化层。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `pipeline.py` | 股票分析主流程，串联数据获取、技术/基本面/新闻上下文、LLM、历史保存和通知。 |
| `backtest_engine.py` | 纯逻辑回测评估，基于分析建议与未来 K 线计算方向、收益、止盈止损。 |
| `trading_calendar.py` | 多市场交易日历、交易阶段和有效交易日推断。 |
| `market_review.py` | 大盘复盘入口，生成报告、保存历史、发送通知。 |
| `market_review_runtime.py` | 组装复盘运行时依赖：通知器、分析器、搜索服务。 |
| `market_review_lock.py` | 复盘互斥锁，防止 CLI/API/定时任务并发运行。 |
| `market_profile.py` | 各市场区域画像、指数、新闻关键词、Prompt 提示。 |
| `market_strategy.py` | 大盘复盘策略蓝图和 Prompt/Markdown 块。 |
| `config_manager.py` | `.env` 配置读写、版本、敏感值掩码、原子更新。 |
| `config_registry.py` | 配置项 schema、分类、字段类型、校验和敏感性元数据。 |

## 主要接口与出入参说明

### `StockAnalysisPipeline`

- 输入：配置对象、并发数、追踪 ID、请求来源、进度回调、技能列表、分析阶段、组合上下文、每日市场上下文开关。
- 输出：分析流水线实例；核心方法输出单股/批量 `AnalysisResult` 风格结果或聚合报告。
- 副作用：初始化数据库、数据源、趋势分析器、LLM、通知器；拉取行情；保存历史；发送通知；记录诊断。

### `BacktestEngine.evaluate_single(...)`

- 输入：操作建议、分析日期、起始价、未来 K 线、止损/止盈价、`EvaluationConfig`。
- 输出：评估状态、方向、收益、止盈止损命中等字典。
- 副作用：无，纯逻辑。

### `trading_calendar` 工具函数

- `get_market_for_stock(code)`：输入股票/指数代码，输出市场代码。
- `is_market_open(market, check_date)`：输入市场和日期，输出是否交易日。
- `get_effective_trading_date(market, current_time)`：输出最近可复用日 K 日期。
- `build_market_phase_context(...)`：输出可序列化的市场阶段上下文。
- 副作用：异常时记录日志，通常不写状态。

### `run_market_review(...)`

- 输入：通知器、可选分析器/搜索服务/配置、通知开关、区域、query ID、保存/持久化选项、触发来源。
- 输出：Markdown 报告；结构化模式返回 `MarketReviewRunResult`。
- 副作用：调用搜索和 LLM；保存报告/历史；发送通知；记录诊断。

### 配置接口

- `ConfigManager.read_config_map()`：读取 `.env` 为键值字典。
- `ConfigManager.apply_updates(updates, sensitive_keys, mask_token)`：原子更新 `.env`，跳过掩码敏感值，返回更新键、跳过键和版本。
- `build_schema_response()`：输出配置 schema 供 UI/API 使用。

## 关联模块

- 依赖：`data_provider/`、`src/services/`、`src/llm/`、`src/notification_sender/`、`src/repositories/`。
- 被调用：`api/`、`bot/`、`scripts/`、调度器和任务队列。
