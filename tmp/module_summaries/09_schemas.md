# 模块：src/schemas

## 模块功能摘要

核心领域 schema 和归一化逻辑目录，定义分析报告、分析上下文包、市场灯、决策动作和评分区间，是服务层、API 层、报告模板之间的数据契约。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `report_schema.py` | 完整分析报告和 dashboard 结构。 |
| `analysis_context_pack.py` | 分析上下文包、上下文块、数据质量结构。 |
| `decision_action.py` | 决策动作归一化和本地化。 |
| `decision_scale.py` | 评分区间、动作/信号映射和冲突判断。 |
| `market_light.py` | 市场灯维度和快照模型。 |

## 主要接口与出入参说明

### `AnalysisReportSchema`

- 输入：股票名、代码、评分、趋势、操作建议、dashboard、分析文本、数据源、模型等字段。
- 输出：结构化完整分析报告。
- 副作用：Pydantic 校验，无外部副作用。

### Dashboard 相关模型

- `CoreConclusion`：输入一句话结论、信号类型、时效、仓位建议。
- `DataPerspective`：输入趋势、价格位置、量能、筹码结构。
- `Intelligence`：输入新闻、风险、催化、业绩、情绪。
- `BattlePlan`：输入狙击点、仓位策略、行动清单。
- `PhaseDecision`：输入阶段上下文、行动窗口、观察条件。
- `SignalAttribution`：输入技术/新闻/基本面/市场权重和最强多空信号。
- 输出：报告 dashboard 结构。

### `AnalysisContextPack`

- 输入：`AnalysisSubject`、阶段、上下文块、数据质量、metadata。
- 输出：标准分析上下文包。
- 副作用：默认生成 `created_at`。

### `normalize_decision_action(value)`

- 输入：自然语言动作、枚举值、中文/英文建议。
- 输出：标准 `DecisionAction` 或 `None`。
- 副作用：无。

### `build_action_fields(...)`

- 输入：操作建议、显式动作、报告类型、语言、评分、风控原因、是否按评分对齐。
- 输出：`DecisionActionFields`，包含 action 和本地化 label。
- 副作用：无。

### `decision_scale.py`

- `normalize_score(value)`：输出 0-100 分或 `None`。
- `decision_band_for_score(value)`：输出评分区间元数据。
- `action_for_score(value)` / `decision_type_for_score(value)`：输出动作/类型。
- `score_action_conflicts_without_guardrail(score, action, guardrail_reason)`：判断评分与动作是否冲突。

### `MarketLightSnapshot`

- 输入：区域、交易日、状态、分数、标签、原因、指导、维度、数据质量。
- 输出：市场灯快照。

## 关联模块

- 被调用：`src/services/`、`api/`、`templates/`、`src/core/pipeline.py`。
