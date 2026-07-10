# 模块：api

## 模块功能摘要

FastAPI 后端 API 层，负责创建应用、挂载中间件和 `/api/v1` 路由，向前端、桌面端和外部调用方暴露分析、历史、行情、回测、配置、认证、组合、告警、决策信号、情报、AlphaSift 等接口。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `app.py` | `create_app()` 应用入口，挂载 API、静态资源、健康检查、SPA fallback。 |
| `deps.py` | 数据库、配置、系统配置服务、运行时调度服务依赖注入。 |
| `v1/router.py` | 聚合 `/api/v1` 子路由。 |
| `middlewares/auth.py` | session/cookie 鉴权中间件。 |
| `middlewares/error_handler.py` | 统一异常响应。 |
| `v1/*.py` | 各业务 REST 路由。 |

## 主要接口与出入参说明

### 应用入口

- `create_app(static_dir: Optional[Path] = None) -> FastAPI`
- 输入：可选前端静态目录。
- 输出：FastAPI 应用实例。
- 副作用：注册中间件、路由、异常处理、静态资源挂载。

### 依赖注入

- `get_db()`：输出 DB 会话/连接上下文。
- `get_config_dep()`：输出配置对象。
- `get_system_config_service(request)`：输出系统配置服务。
- `get_runtime_scheduler_service(request)`：输出调度服务。

### 主要 HTTP 路由

| 路径 | 输入 | 输出/副作用 |
|---|---|---|
| `POST /api/v1/analysis/analyze` | `AnalyzeRequest`：股票代码、报告类型、刷新、异步、阶段、技能、语言、通知等 | 同步分析结果或异步任务；可能写历史、发通知、创建后台任务。 |
| `POST /api/v1/analysis/market-review` | `MarketReviewRequest` | 大盘复盘任务；可能发送通知。 |
| `GET /api/v1/analysis/status/{task_id}` | 任务 ID | 任务状态。 |
| `GET /api/v1/history` / `GET /api/v1/history/{record_id}` | 过滤/分页或记录 ID | 历史列表/详情。 |
| `GET /api/v1/history/{record_id}/markdown` | 记录 ID | Markdown 报告。 |
| `GET /api/v1/stocks/{stock_code}/quote` | 股票代码 | 实时行情。 |
| `GET /api/v1/stocks/{stock_code}/history` | 股票代码、周期/日期范围 | K 线历史。 |
| `POST /api/v1/backtest/run` | 回测参数 | 执行并保存回测。 |
| `GET /api/v1/system/*` | 配置项、校验/测试 payload | 配置读写、导入导出、通道测试。 |
| `POST /api/v1/auth/login` / `logout` | 登录请求 | 设置或清除 session cookie。 |
| `POST/GET/PATCH/DELETE /api/v1/portfolio/*` | 账户、交易、现金、公司行动、导入参数 | 组合 CRUD、快照和风险。 |
| `POST/GET/PATCH/DELETE /api/v1/alerts/*` | 告警规则、过滤条件 | 规则 CRUD、启停、测试、触发/通知历史。 |
| `POST/GET/PATCH /api/v1/decision-signals/*` | 信号、过滤、结果、反馈、状态 | 决策信号创建、查询、后验评估、反馈。 |
| `GET/POST /api/v1/intelligence/*` | 情报源、模板、抓取参数 | 情报源管理、抓取和条目查询。 |
| `GET/POST /api/v1/alphasift/*` | 策略、主题、筛选参数 | AlphaSift 状态、热点、筛选任务。 |

## 关联模块

- 依赖：`src/services/`、`src/schemas/`、`src/repositories/`、`src/core/`。
- 被调用：`apps/dsa-web/`、`apps/dsa-desktop/`、外部 HTTP 客户端。
