# 模块：data_provider

## 模块功能摘要

数据源策略层，统一封装行情、实时行情、指数、市场统计、板块/概念排行、热门股、涨停池、基本面、资金流、龙虎榜、所属板块等能力。核心是 `BaseFetcher` 抽象类和 `DataFetcherManager` 故障切换管理器。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `base.py` | 抽象基类、代码规范化、异常、数据源管理器。 |
| `realtime_types.py` | 统一实时行情、筹码分布、熔断器类型。 |
| `akshare_fetcher.py` | AkShare/东方财富/新浪/腾讯等 A 股和部分海外数据。 |
| `efinance_fetcher.py` | efinance/东方财富行情、指数、市场统计、板块、基础信息。 |
| `tencent_fetcher.py` | 腾讯行情直连兜底。 |
| `tushare_fetcher.py` | Tushare 数据源，需 token。 |
| `pytdx_fetcher.py` | 通达信行情/名称兜底。 |
| `baostock_fetcher.py` | Baostock 历史数据和股票列表。 |
| `yfinance_fetcher.py` | yfinance 海外行情和指数。 |
| `longbridge_fetcher.py` | 长桥 OpenAPI，美股/港股行情和名称。 |
| `finnhub_fetcher.py` / `alphavantage_fetcher.py` | 美股数据源。 |
| `tickflow_fetcher.py` | TickFlow 行情与市场统计。 |
| `fundamental_adapter.py` / `yfinance_fundamental_adapter.py` | 基本面上下文适配。 |
| `us_index_mapping.py` | 美股指数/股票识别和 yfinance 映射。 |

## 主要接口与出入参说明

### 代码工具

- `normalize_stock_code(stock_code)`：输入任意代码，输出规范化代码。
- `canonical_stock_code(code)`：输出标准展示/持久化代码。
- `is_bse_code(code)` / `is_st_stock(name)` / `is_kc_cy_stock(code)`：输出布尔分类结果。
- 副作用：无。

### `BaseFetcher.get_daily_data(stock_code, start_date=None, end_date=None, days=30)`

- 输入：股票代码、起止日期或天数。
- 输出：标准化且带技术指标的 `DataFrame`。
- 副作用：具体子类访问第三方接口，记录日志。

### `DataFetcherManager`

- 初始化输入：可选 fetcher 列表；未传入时初始化默认数据源并按配置调整优先级。
- `get_daily_data(...)`：输出 `(DataFrame, source_name)`；失败抛 `DataFetchError`。
- `get_realtime_quote(stock_code)`：输出 `UnifiedRealtimeQuote` 或 `None`。
- `get_chip_distribution(stock_code)`：输出 `ChipDistribution` 或 `None`。
- `get_stock_name(stock_code, allow_realtime=True)`：输出股票名或 `None`。
- `get_main_indices(region)` / `get_market_stats()` / `get_sector_rankings(n)` / `get_concept_rankings(n)` / `get_hot_stocks(n)` / `get_limit_up_pool(...)`：输出市场上下文数据。
- `get_fundamental_context(...)` / `get_capital_flow_context(...)` / `get_dragon_tiger_context(...)` / `get_board_context(...)`：输出扩展上下文字典。
- 副作用：外部 API 调用、缓存、熔断状态、数据源健康诊断、日志。

### 统一实时类型

- `UnifiedRealtimeQuote`：输入代码、名称、来源、价格、涨跌、量价、估值、质量等字段；`to_dict()` 输出过滤空值字典。
- `ChipDistribution`：输入筹码成本和集中度；`get_chip_status(current_price)` 输出筹码状态描述。
- `CircuitBreaker`：维护数据源失败阈值和冷却状态。

## 关联模块

- 被调用：`src/core/pipeline.py`、`src/services/stock_service.py`、Agent 工具、市场复盘。
- 依赖：第三方行情/基本面服务、配置中的 token 和数据源优先级。
