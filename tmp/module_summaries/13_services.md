# 模块：src/services

## 模块功能摘要

业务服务层，位于 API/任务/调度入口与底层数据、模型、数据库、通知之间。负责分析编排、上下文构建、历史报告、告警、组合、决策信号、回测、配置、任务队列、运行诊断、股票解析、情报、AlphaSift 和外部上下文适配。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `analysis_service.py` / `analyzer_service.py` | 单股/批量分析和大盘复盘服务入口。 |
| `analysis_context_builder.py` / `daily_market_context.py` | 分析上下文包和每日市场上下文。 |
| `history_service.py` / `history_comparison_service.py` / `history_loader.py` | 历史记录、信号变化、K 线历史加载。 |
| `report_renderer.py` | Jinja2 报告渲染。 |
| `alert_service.py` / `alert_worker.py` / `alert_indicators.py` | 告警规则、worker 和技术指标评估。 |
| `market_light_alerts.py` / `portfolio_alerts.py` | 市场灯和组合告警评估。 |
| `decision_signal_*.py` | 决策信号抽取、持久化、重评估、outcome、反馈和摘要。 |
| `backtest_service.py` | 回测编排和查询。 |
| `portfolio_service.py` / `portfolio_risk_service.py` / `portfolio_import_service.py` | 组合账户、交易、风险、CSV 导入。 |
| `task_queue.py` / `task_service.py` / `runtime_scheduler.py` | 异步任务队列、Bot 任务、运行时调度。 |
| `system_config_service.py` / `generation_backend_status_service.py` / `notification_diagnostics.py` | 配置、生成后端状态、通知诊断。 |
| `stock_service.py` / `stock_code_utils.py` / `name_to_code_resolver.py` / `import_parser.py` / `image_stock_extractor.py` | 行情、代码解析、导入和图片提取。 |
| `market_light_service.py` / `intelligence_service.py` / `social_sentiment_service.py` / `alphasift_service.py` | 市场灯、情报源、社交情绪、AlphaSift。 |

## 主要接口与出入参说明

### 分析与报告

- `AnalysisService.analyze_stock(stock_code, report_type, force_refresh, query_id, trace_id, send_notification, progress_callback, skills, analysis_phase, query_source, portfolio_context, report_language)`：输出分析结果；副作用包括数据抓取、LLM、历史保存、通知、诊断。
- `analyze_stock(...)` / `analyze_stocks(...)` / `perform_market_review(...)`：函数式分析入口，输出单股/批量/大盘结果，可能通知。
- `AnalysisContextBuilder.build(artifacts)`：输入流水线产物，输出结构化上下文包；不主动抓取新数据。
- `DailyMarketContextService.get_context(...)`：输入区域、配置、通知器、刷新/生成选项，输出每日市场上下文；可能生成并保存复盘历史。
- `render(platform, results, report_date, summary_only, extra_context)`：输入分析结果和模板上下文，输出 Markdown。

### 历史与诊断

- `HistoryService.get_history_list(...)`：输入过滤/分页，输出历史列表。
- `resolve_and_get_detail/news/diagnostics/run_flow(record_id, ...)`：输入记录 ID，输出详情、新闻、诊断或 run-flow。
- `get_markdown_report(record_id)`：输出 Markdown；失败抛 `MarkdownReportGenerationError`。
- `load_history_df(stock_code, days, target_date)`：DB-first 加载 K 线，失败回退数据源。
- `activate_run_diagnostic_context(...)` / `record_provider_run(...)` / `record_llm_run(...)` / `record_notification_run(...)` / `build_run_diagnostic_summary(...)`：输入运行标识和事件，输出诊断摘要；副作用为 contextvars 中记录诊断事件。

### 告警

- `AlertService.create_rule/update_rule/delete_rule/list_rules/test_rule(...)`：规则 CRUD 和 dry-run；副作用为写库。
- `AlertWorker.run_once()`：执行一轮告警评估；可能写触发/通知/冷却并发送通知。
- `evaluate_indicator_alert(alert_type, stock_code, params, df, now)`：输入技术指标参数和 OHLCV，输出触发评估。
- `evaluate_market_light_alert(rule, current_snapshot, cache)`：输出市场灯告警评估。
- `evaluate_portfolio_risk_alert(rule, portfolio_service, risk_service)`：输出组合风险告警评估。

### 决策信号与回测

- `DecisionSignalService.create_signal/list_signals/get_latest_active/update_status(...)`：信号创建、查询、状态更新；副作用为写库。
- `build_decision_signal_payload_from_report(result, ...)`：输入分析结果和上下文，输出待保存信号 payload。
- `extract_and_persist_from_analysis_result(...)`：尽力抽取并保存信号，失败通常不阻断主分析。
- `DecisionSignalReassessService.reassess(source_report_id, decision_profile, persist=False)`：输出预览式再评估结果；不改写信号表。
- `DecisionSignalOutcomeService.run_outcomes(...)`：计算并写入/更新 outcome。
- `BacktestService.run_backtest(...)` / `get_summary(...)`：执行回测并查询摘要。

### 投资组合

- `PortfolioService.create_account/list_accounts/update_account/deactivate_account(...)`：账户 CRUD。
- `record_trade/record_cash_ledger/record_corporate_action(...)`：写组合事件；可能校验超卖/冲突。
- `get_portfolio_snapshot(account_id, as_of, cost_method, include_realtime)`：输出组合快照。
- `PortfolioRiskService.get_risk_report(...)`：输出集中度、回撤、止损接近度等风险报告。
- `PortfolioImportService.parse_trade_csv(broker, content)` / `commit_trade_records(...)`：解析并导入券商 CSV。

### 任务、调度、配置

- `AnalysisTaskQueue.submit_task(...)` / `submit_tasks_batch(...)`：提交异步任务；重复时可能抛 `DuplicateTaskError`。
- `update_task_progress(task_id, progress, message, event_type)`：更新并广播任务进度。
- `TaskService.submit_analysis(...)`：Bot/异步分析任务入口。
- `RuntimeSchedulerService.start/stop/reconcile_from_config/run_now/status()`：长驻进程定时分析调度。
- `SystemConfigService.get_config/update/import_env/test_generation_backend(...)`：配置读写、导入和生成后端测试。
- `GenerationBackendStatusService.get_status/smoke_test(...)`：只读生成后端状态和 smoke test。

### 股票、情报和外部上下文

- `StockService.get_realtime_quote/get_history_data(...)`：输出实时和历史行情。
- `normalize_code/is_code_like/resolve_index_stock_code_for_analysis(...)`：股票代码规范化和后缀市场解析。
- `resolve_name_to_code(name)`：名称到代码解析。
- `parse_import_from_bytes/parse_import_from_text(...)`：CSV/Excel/文本导入解析。
- `extract_stock_codes_from_image(image_bytes, mime_type)`：校验图片并调用视觉模型提取股票。
- `IntelligenceService.create_source/fetch_source/fetch_enabled_sources/list_items(...)`：情报源管理、抓取和查询。
- `AlphaSiftService.status/strategies/hotspots/screen(...)`：AlphaSift 状态、热点和筛选。

## 关联模块

- 上游：`api/`、`bot/`、调度器、前端请求。
- 下游：`src/core/`、`data_provider/`、`src/repositories/`、`src/llm/`、`src/notification_sender/`、`templates/`。
