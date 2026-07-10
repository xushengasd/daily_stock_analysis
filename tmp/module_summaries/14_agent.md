# 模块：src/agent

## 模块功能摘要

股票分析 Agent 框架，负责单 Agent/多 Agent 执行、工具注册与调用、技术/情报/风险/组合/决策 Agent 管线、会话上下文、provider trace、技能/策略加载路由、事件告警和深度研究。

## 关键文件职责

| 文件/目录 | 职责 |
|---|---|
| `factory.py` | 构建 `AgentExecutor` 或 `AgentOrchestrator`。 |
| `executor.py` | 单 Agent ReAct 执行器和聊天入口。 |
| `orchestrator.py` | 多 Agent 管线编排。 |
| `protocols.py` | `AgentContext`、`AgentOpinion`、`StageResult`、统计结构。 |
| `agents/*.py` | 技术、情报、风险、组合、决策等专门 Agent。 |
| `llm_adapter.py` | Agent tool-calling LLM 适配器。 |
| `tools/` | 工具定义、注册、行情/技术/新闻/组合/回测工具。 |
| `conversation.py` / `chat_context.py` | 会话历史、可见上下文、摘要压缩。 |
| `stock_scope.py` | 股票作用域解析和约束。 |
| `events.py` | 事件告警规则与监控。 |
| `research.py` | 深度研究 Agent。 |
| `skills/` / `strategies/` | 技能和策略加载、路由、聚合。 |

## 主要接口与出入参说明

### `build_agent_executor(config=None, skills=None)`

- 输入：配置对象、激活技能列表。
- 输出：单 Agent `AgentExecutor` 或多 Agent `AgentOrchestrator`。
- 副作用：初始化工具注册表、技能管理器、LLM tool adapter，记录日志。

### `AgentExecutor.run(task, context=None)` / `chat(message, session_id, progress_callback=None, context=None)`

- 输入：用户任务/聊天消息、会话 ID、上下文字典、进度回调。
- 输出：`AgentResult`，含 success、content、dashboard、tool_calls、steps、tokens、provider、model、error。
- 副作用：调用 LLM、调用工具、读写会话历史、保存 provider trace。

### `AgentOrchestrator.run(task, context=None)` / `chat(...)`

- 输入：分析任务或聊天消息、上下文。
- 输出：兼容 `AgentResult` 的最终内容和 dashboard。
- 副作用：执行技术、情报、风险、组合、决策、技能/策略阶段；统计 token/工具调用；降级生成 dashboard。

### 共享结构

- `AgentContext`：输入 query、股票代码/名称、session、data、opinions、risk_flags、meta；方法用于读写共享状态。
- `AgentOpinion`：输入 agent 名、signal、confidence、reasoning、key_levels、raw_data；输出单 Agent 观点。
- `StageResult`：输入阶段名、状态、观点、错误、耗时、tokens、工具数、meta；输出阶段执行结果。
- `AgentRunStats`：聚合阶段数、成功/失败/跳过、token、工具调用、模型、耗时。

### `BaseAgent.run(ctx, progress_callback=None, timeout_seconds=None)`

- 输入：`AgentContext`、进度回调、阶段超时。
- 输出：`StageResult`。
- 副作用：调用 LLM 和工具，将 `AgentOpinion` 写入 `ctx.opinions`，注入历史记忆和预取数据。

### `LLMToolAdapter.call_with_tools(messages, tools, provider=None, timeout=None)`

- 输入：消息列表、OpenAI tools 格式声明、provider、超时。
- 输出：`LLMResponse`，包含文本或 tool calls。
- 副作用：发起 LLM 请求。

### `ToolRegistry`

- `register/unregister/get/resolve/list_tools/list_names/to_openai_tools/execute`。
- 输入：工具定义、工具名、参数。
- 输出：工具 schema 或执行结果。
- 副作用：注册/移除工具，`execute()` 调用实际 handler。

### 常用工具

- 行情：`get_realtime_quote(stock_code)`、`get_daily_history(stock_code, days)`、`get_chip_distribution(stock_code)`。
- 技术：`analyze_trend(stock_code)`、`calculate_ma(stock_code, periods, days)`、`get_volume_analysis(stock_code, days)`、`analyze_pattern(stock_code, days)`。
- 情报：`search_stock_news(stock_code, stock_name)`、`search_comprehensive_intel(stock_code, stock_name)`。
- 市场/组合/回测：`get_market_indices(region)`、`get_sector_rankings(top_n)`、`get_portfolio_snapshot(...)`、`get_skill_backtest_summary(...)`。

### 会话、作用域、研究

- `ConversationManager.add_message/get_history/clear(...)`：读写内存和数据库会话历史。
- `build_agent_chat_context_bundle(session_id, llm_adapter, config)`：输出聊天上下文和摘要消息，可能调用 LLM 摘要。
- `resolve_stock_scope(message, context)`：输出股票代码候选和有效作用域。
- `ResearchAgent.research(query, context=None, progress_callback=None, timeout_seconds=None)`：输出研究报告、子问题、发现数量、token、耗时；副作用为 LLM 和工具调用。

## 关联模块

- 依赖：`src/llm/`、`data_provider/`、`src/services/`、`strategies/`。
- 被调用：API Agent 路由、Bot 聊天/研究、分析 pipeline。
