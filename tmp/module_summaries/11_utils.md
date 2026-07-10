# 模块：src/utils

## 模块功能摘要

通用工具函数目录，负责分析 metadata 提取、数据字段标准化、上下文提取、敏感信息脱敏、狙击点解析、dashboard/report 信号归因归一化等横切逻辑。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `data_processing.py` | 报告/上下文数据解析、实时/基本面/板块字段提取、信号归因归一化。 |
| `sanitize.py` | 诊断、决策信号、payload 中敏感信息脱敏。 |
| `sniper_points.py` | 买点、加仓点、止损、止盈等价格点解析和提取。 |
| `analysis_metadata.py` | 分析过程 metadata 提取和组织。 |

## 主要接口与出入参说明

### `data_processing.py`

- `normalize_model_used(value)`：输入模型字段，输出标准字符串或 `None`。
- `parse_json_field(value)`：输入 JSON 字符串/对象，输出解析对象。
- `extract_realtime_detail_fields(context_snapshot)`：输入上下文快照，输出实时行情详情字段。
- `extract_fundamental_detail_fields(...)`：输出基本面详情字段。
- `extract_board_detail_fields(...)`：输出板块详情字段。
- `normalize_signal_attribution_values(signal_attr)`：输入信号归因 dict，输出标准化权重/字段。
- `normalize_dashboard_signal_attribution(dashboard)` / `normalize_report_signal_attribution(payload)`：原地归一化传入 dict。
- `signal_attribution_weight_items(signal_attr)`：输出权重列表。
- 副作用：部分函数原地修改传入字典。

### `sanitize.py`

- `sanitize_diagnostic_text(text, max_length=300)`：输出截断/脱敏文本。
- `redact_sensitive_mapping(obj)`：输入 dict/list/标量，输出脱敏对象。
- `sanitize_decision_signal_text(text)`：输出决策信号脱敏文本。
- `sanitize_decision_signal_payload(obj)`：输出脱敏 payload。
- 识别：token/key/secret/password 字段、webhook URL、敏感 query 参数等。

### `sniper_points.py`

- `parse_sniper_value(value)`：输入数字、字符串、范围/带单位文本，输出 float 或 `None`。
- `extract_sniper_points(result)`：输入分析结果对象/dict，输出 `ideal_buy`、`secondary_buy`、`stop_loss`、`take_profit` 等。
- `find_sniper_points(data)`：输入嵌套报告 dict，输出 sniper_points 节点或 `None`。

### `analysis_metadata.py`

- 输入：分析任务、上下文快照、报告 payload 等。
- 输出：标准 metadata dict。
- 副作用：无明显外部副作用。

## 关联模块

- 被调用：`src/services/`、`api/`、`src/core/`、报告渲染和诊断输出。
