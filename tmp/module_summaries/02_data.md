# 模块：src/data

## 模块功能摘要

轻量数据辅助层，提供股票代码/名称映射、股票自动补全索引加载、代码解析、名称查找和进程内缓存。它不负责行情拉取，只为分析、API 搜索和数据源层提供基础索引能力。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `stock_mapping.py` | 内置常用股票代码到名称映射；过滤无意义股票名。 |
| `stock_index_loader.py` | 从远端缓存、前端 public、static 等路径加载 `stocks.index.json`，构建名称和代码索引。 |
| `__init__.py` | 包初始化。 |

## 主要接口与出入参说明

### `is_meaningful_stock_name(name, stock_code)`

- 输入：候选股票名、股票代码。
- 输出：布尔值，表示是否为有效展示名。
- 副作用：无。

### `get_stock_index_candidate_paths()`

- 输入：无。
- 输出：候选索引路径元组。
- 副作用：无。

### `find_existing_stock_index_path(candidate_paths=None, remote_cache_path=None)`

- 输入：候选路径、远端缓存路径。
- 输出：可用 `stocks.index.json` 路径或 `None`。
- 副作用：读取文件元数据，可能校验缓存有效性。

### `get_stock_name_index_map()` / `get_stock_code_index_map()`

- 输入：无。
- 输出：代码/别名到名称映射，或输入代码到规范代码映射。
- 副作用：懒加载 JSON，写入进程内缓存，记录日志。

### `get_index_stock_name(stock_code)`

- 输入：规范代码、展示代码、港股/后缀市场代码等。
- 输出：股票名称或 `None`。
- 副作用：可能触发索引懒加载。

### `resolve_index_stock_code(query)`

- 输入：用户输入代码。
- 输出：规范代码或 `None`。
- 副作用：可能触发代码索引懒加载。

### `clear_stock_index_cache()`

- 输入/输出：无。
- 副作用：清空名称、代码和远端有效性缓存。

## 关联模块

- 被调用：`src/services/stock_code_utils.py`、股票搜索、名称解析、数据源名称兜底。
- 依赖：远端或本地 `stocks.index.json`。
