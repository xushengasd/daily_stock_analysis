# 模块：apps

## 模块功能摘要

前端应用目录，包含 React + Vite Web 前端 `dsa-web` 和 Electron 桌面壳 `dsa-desktop`。Web 前端负责页面、状态和 API 封装；桌面端负责启动本地后端、窗口、更新和 IPC bridge。

## 关键文件职责

| 文件/目录 | 职责 |
|---|---|
| `apps/dsa-web/src/api/index.ts` | axios 客户端、cookie、401 跳转、错误解析。 |
| `apps/dsa-web/src/api/*.ts` | 后端 `/api/v1/*` TypeScript API 封装。 |
| `apps/dsa-web/src/pages/*.tsx` | 首页、聊天、历史、回测、组合、告警、决策信号、设置、用量、选股、登录等页面。 |
| `apps/dsa-desktop/main.js` | Electron main：后端进程、端口、健康检查、窗口、更新、备份恢复。 |
| `apps/dsa-desktop/preload.js` | 暴露 `window.dsaDesktop` IPC bridge。 |
| `apps/dsa-desktop/renderer/loading.html` | 桌面启动加载页。 |

## 主要接口与出入参说明

### Web API Client

- 输入：页面/组件传入的 TypeScript payload。
- 输出：Promise，通常返回 camelCase 数据。
- 副作用：发 HTTP 请求；401 跳转登录；部分接口抛业务错误。

| API 封装 | 输入 | 输出/副作用 |
|---|---|---|
| `analysisApi.analyze/analyzeAsync` | `AnalysisRequest` | 同步结果或异步任务；409 可抛重复任务错误。 |
| `analysisApi.triggerMarketReview` | 大盘复盘请求 | 创建复盘任务。 |
| `historyApi.getList/getDetail/getMarkdown/deleteRecords` | 过滤、记录 ID、ID 列表 | 历史列表/详情/Markdown/删除。 |
| `stocksApi` | 股票代码、搜索词、导入内容 | 搜索、行情、历史、导入解析。 |
| `backtestApi` | 回测参数、过滤分页 | 回测执行、结果和表现。 |
| `portfolioApi` | 账户、交易、现金、公司行动、导入、快照参数 | 组合 CRUD、快照、风险、汇率。 |
| `alertsApi` | 告警规则、过滤、ID | 规则 CRUD、启停、测试、历史。 |
| `decisionSignalsApi` | 信号创建/过滤/重评估/反馈/状态参数 | 决策信号、outcome、统计、反馈。 |
| `systemConfigApi` | 配置项、导入、测试、校验 payload | 系统配置读写和通道测试。 |
| `usageApi.getDashboard` | period、limit | 用量仪表盘。 |
| `alphasiftApi` | 启用开关、策略、主题、筛选 payload | 状态、热点、筛选任务。 |
| `agentApi` | 聊天/研究请求、会话 ID | 模型/技能、聊天、研究、会话管理。 |

### Desktop IPC / Bridge

- `readDesktopVersion(argv?)`：输入进程参数，输出桌面版本。
- `createDesktopBridge(...)`：输出注入 `window.dsaDesktop` 的对象。
- IPC 通道：`desktop:get-update-state`、`desktop:check-for-updates`、`desktop:install-downloaded-update`、`desktop:open-release-page`、`desktop:update-state`。
- 副作用：检查/安装更新、打开浏览器、订阅 main 进程状态。

### Desktop main 内部接口

- `findAvailablePort(startPort, endPort, host)`：输出可用端口。
- `startBackend({ port, envFile, dbPath, logDir, host })`：启动 Python/FastAPI 后端，输出子进程引用。
- `waitForHealth(...)`：输出健康检查是否成功。
- `stopBackend()`：停止后端进程。
- `checkForDesktopUpdates(...)`：访问 release API 并输出更新状态。
- `backupPackagedRuntimeState()` / `restorePackagedRuntimeStateFromBackup()`：备份/恢复运行时文件。

## 关联模块

- Web 依赖：`api/` HTTP 契约。
- Desktop 依赖：后端启动命令、静态构建产物、系统运行时文件。
