# 模块：src/repositories

## 模块功能摘要

数据库访问层，封装 SQLAlchemy/DatabaseManager 操作，负责分析历史、股票日线、回测、告警、情报、决策信号、组合账户/交易/快照/汇率等持久化读写。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `analysis_repo.py` | 分析历史读写。 |
| `stock_repo.py` | 股票日线读写和上下文查询。 |
| `backtest_repo.py` | 回测候选、结果和汇总读写。 |
| `alert_repo.py` | 告警规则、触发、通知、冷却状态读写。 |
| `intelligence_repo.py` | 情报源和情报条目读写。 |
| `decision_signal_repo.py` | 决策信号读写和状态更新。 |
| `decision_signal_outcome_repo.py` | 信号 outcome、统计和反馈读写。 |
| `portfolio_repo.py` | 组合账户、交易、现金、公司行动、快照、汇率读写。 |

## 主要接口与出入参说明

### `AnalysisRepository`

- `get_by_query_id(query_id)`：输入 query ID，输出历史记录或 `None`。
- `get_list(...)`：输入过滤/分页，输出历史记录列表。
- `save(...)`：输入分析结果字段，写入历史并返回记录。
- `count_by_code(code, days)`：输出近期分析次数。

### `StockRepository`

- `get_latest(code, days)` / `get_range(code, start_date, end_date)`：输出日线列表。
- `save_dataframe(code, df)`：输入 DataFrame，写日线，输出保存数量。
- `has_today_data(code, target_date)`：输出是否已有目标日期数据。
- `get_analysis_context(...)` / `get_forward_bars(...)`：输出分析/回测上下文。

### `BacktestRepository`

- `get_candidates(...)`：输出待回测分析记录。
- `save_result(result)` / `save_results_batch(results, replace_existing)`：写回测结果。
- `get_results_paginated(...)` / `list_results(...)`：查询结果。
- `upsert_summary(summary)` / `get_summary(...)`：写读汇总。

### `AlertRepository`

- `create_rule(fields)` / `update_rule(rule_id, fields)` / `delete_rule(rule_id)`：规则 CRUD。
- `list_enabled_rules(limit)`：输出启用规则。
- `create_trigger_if_absent(fields)`：幂等写触发记录。
- `record_notification_attempt(fields)`：写通知尝试。
- `upsert_cooldown(...)`：更新冷却状态。
- `list_triggers(...)` / `list_notifications(...)`：查询历史。

### `DecisionSignalRepository`

- `create(fields)` / `create_if_absent(fields, ...)`：创建或复用信号。
- `list(...)`：按代码、市场、动作、状态、日期、分页查询。
- `get_latest_active(...)`：获取最新活跃信号。
- `update_status(signal_id, status, ...)`：更新状态。
- `expire_due_signals(now)`：过期到期信号。

### `DecisionSignalOutcomeRepository`

- `list_candidate_signals(...)`：输出待评估信号。
- `upsert_outcome(fields)`：写/更新 outcome。
- `list_stats_rows(...)`：输出统计行。
- `get_feedback(signal_id)` / `upsert_feedback(fields)`：读写人工反馈。

### `PortfolioRepository`

- 账户：`create_account`、`get_account`、`list_accounts`、`update_account`、`deactivate_account`。
- 事件：`add_trade`、`add_cash_ledger`、`add_corporate_action` 及删除/查询方法。
- 价格/汇率：`get_latest_close`、`save_fx_rate`、`get_latest_fx_rate`。
- 快照：`replace_positions_and_lots`、`upsert_daily_snapshot`、`replace_positions_lots_and_snapshot`。
- 副作用：写组合事件、缓存持仓/批次、风险快照；重复或锁冲突时抛专用异常。

## 关联模块

- 被调用：`src/services/`、`src/core/`。
- 依赖：数据库模型和 `DatabaseManager`。
