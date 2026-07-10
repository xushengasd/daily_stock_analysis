# 模块：strategies

## 模块功能摘要

自然语言交易策略目录。系统加载 `.yaml` 策略文件后，将其作为可复用策略/skill 注入 Agent、路由和股票分析 Prompt。该目录本身不含 Python 执行逻辑。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `README.md` | 策略 YAML 编写说明。 |
| `bull_trend.yaml` | 默认多头趋势策略。 |
| `ma_golden_cross.yaml` | 均线金叉策略。 |
| `volume_breakout.yaml` | 放量突破策略。 |
| `shrink_pullback.yaml` | 缩量回踩策略。 |
| `bottom_volume.yaml` | 底部放量策略。 |
| `dragon_head.yaml` | 龙头策略。 |
| `emotion_cycle.yaml` | 情绪周期框架。 |
| `hot_theme.yaml` | 热点题材框架。 |
| `growth_quality.yaml` | 成长质量框架。 |
| `event_driven.yaml` | 事件驱动框架。 |
| `expectation_repricing.yaml` | 预期重估框架。 |
| `chan_theory.yaml` | 缠论框架。 |
| `wave_theory.yaml` | 波浪理论框架。 |
| `one_yang_three_yin.yaml` | 一阳夹三阴形态策略。 |

## 策略配置出入参说明

每个 YAML 主要字段：

- `name`：唯一策略 ID；输出为内部技能/策略标识。
- `display_name`：展示名称；输出到 UI/报告。
- `description`：策略简述；用于路由和提示词。
- `category`：策略分类，如 `trend`、`pattern`、`reversal`、`framework`。
- `core_rules`：关联内置交易原则。
- `required_tools`：建议使用的工具，如 `get_daily_history`、`analyze_trend`、`search_stock_news`。
- `aliases`：自然语言别名，用于用户输入匹配。
- `default_active`：是否默认激活。
- `default_router`：是否参与路由 fallback。
- `default_priority`：默认排序/路由优先级。
- `market_regimes`：适用市场环境标签。
- `instructions`：注入分析 Prompt 的策略说明。

## 输入输出与副作用

- 输入：内置 YAML 文件；可选自定义策略目录 `AGENT_SKILL_DIR`。
- 输出：加载后的策略元数据和自然语言 instructions。
- 副作用：目录本身无运行副作用；被加载后会影响分析关注点、评分、买卖理由和风险提示。

## 关联模块

- 被调用：`src/agent/skills`、`src/agent/strategies`、分析 pipeline。
