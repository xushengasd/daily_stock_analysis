# 模块：scripts

## 模块功能摘要

维护、诊断、数据生成和自动化脚本目录，覆盖环境检查、AI 资产检查、静态资源检查、股票索引生成/刷新、Tushare 股票列表抓取、Longbridge OAuth token、通知 action 文档生成和飞书 E2E 测试。

## 关键脚本与接口说明

| 文件 | 输入 | 输出/副作用 |
|---|---|---|
| `check_ai_assets.py` | 仓库内 `.claude`、Copilot 指令等 | 控制台检查结果；失败退出非 0。 |
| `check_env.py` | CLI 参数、`.env`、数据库、行情/LLM/通知配置 | 打印诊断；可能调用外部服务。 |
| `check_static_assets.py` | static 目录 | 检查缺失/孤儿 assets，退出码表示结果。 |
| `e2e_test_feishu_app.py` | 飞书配置、测试消息 | 发送/验证飞书交互。 |
| `fetch_tushare_stock_list.py` | Tushare token、market、输出目录 | 生成股票列表 CSV/文档；调用 Tushare。 |
| `generate_index_from_csv.py` | CSV 数据目录、日志目录、输出路径 | 生成股票索引 JSON。 |
| `generate_stock_index.py` | CLI 参数、股票映射 | 输出索引 JSON，可压缩。 |
| `refresh_stock_index.py` | CLI 参数、Tushare token | 刷新并同步前端 public 索引。 |
| `generate_longbridge_oauth_token.py` | client_id、redirect/code、环境变量 | 写 token cache 或打印 token。 |
| `generate_notification_actions_env_table.py` | workflow 文件、README block | 生成/校验 Markdown 表格，可能更新文档。 |

## 主要接口与出入参说明

### `check_env.py`

- 输入：检查范围、股票代码、天数、外部服务配置。
- 输出：控制台诊断和返回码。
- 副作用：可能请求行情、LLM、通知服务；通常不写业务数据。

### `fetch_tushare_stock_list.py`

- `get_tushare_api()`：输入 token 配置，输出 API 客户端。
- `fetch_a_stock_list(api)` / `fetch_hk_stock_list(api)` / `fetch_us_stock_list(api)`：输出 DataFrame。
- `save_to_csv(df, filename, market_name)`：写股票列表 CSV。

### `generate_index_from_csv.py`

- `load_csv_data(csv_path)` / `load_tushare_data(data_dir)` / `load_akshare_data(logs_dir)`：读取股票源数据。
- `parse_stock_row(row, preferred_market=None)`：输出标准股票条目。
- `build_stock_index(stocks)` / `compress_index(index)`：输出索引结构。
- 副作用：写输出 JSON。

### `refresh_stock_index.py`

- 输入：CLI 参数和 token。
- 输出：刷新结果。
- 副作用：调用生成脚本，同步 `apps/dsa-web/public/stocks.index.json` 等静态索引。

## 关联模块

- 依赖：配置、数据源、前端 public/static 目录、GitHub workflow/文档。
- 被调用：开发者、CI、维护任务。
