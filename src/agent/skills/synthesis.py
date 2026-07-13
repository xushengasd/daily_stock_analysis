# -*- coding: utf-8 -*-
"""
Strategy synthesis helpers for skill-agent consensus.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, Iterable, List, Optional

from src.agent.protocols import AgentOpinion, StrategyConflict, StrategyOpinion
from src.agent.skills.defaults import extract_skill_id
from src.report_language import (
    localize_conflict_severity,
    localize_consensus_level,
    localize_strategy_signal,
    normalize_report_language,
)

SIGNAL_SCORES: Dict[str, float] = {
    "strong_buy": 5.0,
    "buy": 4.0,
    "hold": 3.0,
    "sell": 2.0,
    "strong_sell": 1.0,
}

_SEVERITY_RANK = {"none": 0, "low": 1, "medium": 2, "high": 3}


def strategy_opinion_from_agent_opinion(opinion: AgentOpinion) -> StrategyOpinion:
    raw_data = opinion.raw_data if isinstance(opinion.raw_data, dict) else {}
    skill_id = str(raw_data.get("skill_id") or extract_skill_id(opinion.agent_name) or opinion.agent_name)
    key_levels = opinion.key_levels or raw_data.get("key_levels") or {}
    if not isinstance(key_levels, dict):
        key_levels = {}

    return StrategyOpinion(
        skill_id=skill_id,
        agent_name=opinion.agent_name,
        signal=str(opinion.signal or raw_data.get("signal") or "hold"),
        confidence=opinion.confidence,
        reasoning=str(opinion.reasoning or raw_data.get("reasoning") or ""),
        score_adjustment=_as_float(raw_data.get("score_adjustment"), 0.0),
        conditions_met=_as_string_list(raw_data.get("conditions_met")),
        conditions_missed=_as_string_list(raw_data.get("conditions_missed")),
        key_levels=key_levels,
        raw_data=raw_data,
    )


class ConflictDetector:
    """Detect deterministic disagreements among strategy opinions."""

    def detect(
        self,
        opinions: List[StrategyOpinion],
        *,
        final_signal: Optional[str] = None,
    ) -> List[StrategyConflict]:
        if len(opinions) < 2:
            return []

        conflicts: List[StrategyConflict] = []
        conflicts.extend(self._detect_directional_opposition(opinions))
        conflicts.extend(self._detect_wide_score_dispersion(opinions))
        if final_signal:
            conflicts.extend(self._detect_high_confidence_dissent(opinions, final_signal))
        conflicts.extend(self._detect_adjustment_contradiction(opinions))
        return sorted(conflicts, key=self._sort_key)

    @staticmethod
    def _detect_directional_opposition(opinions: List[StrategyOpinion]) -> List[StrategyConflict]:
        bullish = [op for op in opinions if SIGNAL_SCORES.get(op.signal, 3.0) >= 4.0]
        bearish = [op for op in opinions if SIGNAL_SCORES.get(op.signal, 3.0) <= 2.0]
        if not bullish or not bearish:
            return []

        max_bull_conf = max(op.confidence for op in bullish)
        max_bear_conf = max(op.confidence for op in bearish)
        severity = "high" if max_bull_conf >= 0.7 and max_bear_conf >= 0.7 else "medium"
        participants = _unique_ids([*bullish, *bearish])
        return [
            StrategyConflict(
                conflict_type="directional_opposition",
                severity=severity,
                description="策略方向出现对立：部分策略看多，部分策略看空，综合结论需要降低确定性。",
                participants=participants,
                metadata={
                    "bullish": [op.skill_id for op in bullish],
                    "bearish": [op.skill_id for op in bearish],
                    "max_bullish_confidence": round(max_bull_conf, 4),
                    "max_bearish_confidence": round(max_bear_conf, 4),
                },
            )
        ]

    @staticmethod
    def _detect_wide_score_dispersion(opinions: List[StrategyOpinion]) -> List[StrategyConflict]:
        scored = [(op, SIGNAL_SCORES.get(op.signal, SIGNAL_SCORES["hold"])) for op in opinions]
        min_score = min(score for _, score in scored)
        max_score = max(score for _, score in scored)
        spread = max_score - min_score
        if spread < 2.0:
            return []

        participants = [op.skill_id for op, score in scored if score in {min_score, max_score}]
        return [
            StrategyConflict(
                conflict_type="wide_score_dispersion",
                severity="high" if spread >= 3.0 else "medium",
                description="策略信号分数分布较宽，说明多策略对行情结构存在明显分歧。",
                participants=_unique_strings(participants),
                metadata={"min_score": min_score, "max_score": max_score, "spread": spread},
            )
        ]

    @staticmethod
    def _detect_high_confidence_dissent(
        opinions: List[StrategyOpinion],
        final_signal: str,
    ) -> List[StrategyConflict]:
        final_score = SIGNAL_SCORES.get(final_signal, SIGNAL_SCORES["hold"])
        dissenters = [
            op
            for op in opinions
            if op.confidence >= 0.75 and abs(SIGNAL_SCORES.get(op.signal, 3.0) - final_score) >= 2.0
        ]
        if not dissenters:
            return []

        return [
            StrategyConflict(
                conflict_type="high_confidence_dissent",
                severity="medium",
                description="存在高置信少数派策略与综合信号明显不一致，应保留反方观点。",
                participants=[op.skill_id for op in dissenters],
                metadata={
                    "final_signal": final_signal,
                    "dissenters": [
                        {"skill_id": op.skill_id, "signal": op.signal, "confidence": round(op.confidence, 4)}
                        for op in dissenters
                    ],
                },
            )
        ]

    @staticmethod
    def _detect_adjustment_contradiction(opinions: List[StrategyOpinion]) -> List[StrategyConflict]:
        positive = [op for op in opinions if op.score_adjustment >= 8]
        negative = [op for op in opinions if op.score_adjustment <= -8]
        if not positive or not negative:
            return []

        max_positive = max(op.score_adjustment for op in positive)
        min_negative = min(op.score_adjustment for op in negative)
        severity = "high" if max_positive >= 15 and min_negative <= -15 else "medium"
        return [
            StrategyConflict(
                conflict_type="adjustment_contradiction",
                severity=severity,
                description="策略加减分方向相互矛盾，说明不同策略对同一标的的边际评分分歧较大。",
                participants=_unique_ids([*positive, *negative]),
                metadata={"max_positive_adjustment": max_positive, "min_negative_adjustment": min_negative},
            )
        ]

    @staticmethod
    def _sort_key(conflict: StrategyConflict) -> tuple[int, str, str]:
        return (-_SEVERITY_RANK.get(conflict.severity, 0), conflict.conflict_type, ",".join(conflict.participants))


class StrategySynthesizer:
    """Build an explainable synthesis payload for strategy consensus."""

    def synthesize(
        self,
        opinions: List[StrategyOpinion],
        *,
        weighted_score: float,
        final_signal: str,
        weighted_confidence: float,
        conflicts: List[StrategyConflict],
        report_language: str = "zh",
    ) -> Dict[str, Any]:
        conflict_severity = _highest_severity(conflicts)
        adjusted_confidence = self.adjust_confidence(weighted_confidence, conflict_severity)
        final_score = SIGNAL_SCORES.get(final_signal, SIGNAL_SCORES["hold"])
        supporting, opposing, neutral = self._group_opinions(opinions, final_score)
        consensus_level = self._consensus_level(opinions, conflicts, final_signal)

        return {
            "final_signal": final_signal,
            "weighted_score": round(weighted_score, 4),
            "confidence": round(adjusted_confidence, 4),
            "original_confidence": round(max(0.0, min(1.0, weighted_confidence)), 4),
            "conflict_count": len(conflicts),
            "conflict_severity": conflict_severity,
            "conflicts": [_conflict_to_dict(conflict) for conflict in conflicts],
            "supporting_skills": supporting,
            "opposing_skills": opposing,
            "neutral_skills": neutral,
            "consensus_level": consensus_level,
            "summary": self._summary(final_signal, consensus_level, conflict_severity, len(opinions), len(conflicts), report_language),
        }

    @staticmethod
    def adjust_confidence(confidence: float, conflict_severity: str) -> float:
        adjusted = max(0.0, min(1.0, confidence))
        if conflict_severity == "high":
            adjusted *= 0.85
        elif conflict_severity == "medium":
            adjusted *= 0.93
        return max(0.0, min(1.0, adjusted))

    @staticmethod
    def _group_opinions(
        opinions: List[StrategyOpinion],
        final_score: float,
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        supporting: List[Dict[str, Any]] = []
        opposing: List[Dict[str, Any]] = []
        neutral: List[Dict[str, Any]] = []
        for op in opinions:
            score = SIGNAL_SCORES.get(op.signal, SIGNAL_SCORES["hold"])
            item = _opinion_to_item(op)
            if abs(score - final_score) < 1.0:
                supporting.append(item)
            elif abs(score - final_score) >= 2.0:
                opposing.append(item)
            else:
                neutral.append(item)
        return supporting, opposing, neutral

    @staticmethod
    def _consensus_level(opinions: List[StrategyOpinion], conflicts: List[StrategyConflict], final_signal: str) -> str:
        if not opinions:
            return "low"
        conflict_severity = _highest_severity(conflicts)
        if conflict_severity == "high":
            return "low"
        final_score = SIGNAL_SCORES.get(final_signal, SIGNAL_SCORES["hold"])
        aligned = sum(1 for op in opinions if abs(SIGNAL_SCORES.get(op.signal, 3.0) - final_score) < 1.0)
        aligned_ratio = aligned / len(opinions)
        if not conflicts and aligned_ratio >= 2 / 3:
            return "high"
        if conflict_severity == "medium" or aligned_ratio < 0.5:
            return "low" if conflict_severity == "medium" and aligned_ratio < 0.5 else "medium"
        return "medium"

    @staticmethod
    def _summary(
        final_signal: str,
        consensus_level: str,
        conflict_severity: str,
        opinion_count: int,
        conflict_count: int,
        report_language: str,
    ) -> str:
        language = normalize_report_language(report_language)
        signal_label = localize_strategy_signal(final_signal, language)
        consensus_label = localize_consensus_level(consensus_level, language)
        severity_label = localize_conflict_severity(conflict_severity, language)
        if language == "en":
            if conflict_count:
                return (
                    f"Strategy synthesis from {opinion_count} strategies: final signal is {signal_label}, "
                    f"consensus level is {consensus_label}, conflict severity is {severity_label}."
                )
            return (
                f"Strategy synthesis from {opinion_count} strategies: final signal is {signal_label}, "
                f"consensus level is {consensus_label}, with no detected conflicts."
            )
        if language == "ko":
            if conflict_count:
                return (
                    f"{opinion_count}개 전략의 종합 판단: 종합 신호는 {signal_label}, "
                    f"공감도는 {consensus_label}, 충돌 강도는 {severity_label}입니다."
                )
            return (
                f"{opinion_count}개 전략의 종합 판단: 종합 신호는 {signal_label}, "
                f"공감도는 {consensus_label}, 감지된 전략 충돌은 없습니다."
            )
        if conflict_count:
            return (
                f"来自 {opinion_count} 个策略的综合判断：综合信号为{signal_label}，"
                f"共识度为{consensus_label}，冲突强度为{severity_label}。"
            )
        return (
            f"来自 {opinion_count} 个策略的综合判断：综合信号为{signal_label}，"
            f"共识度为{consensus_label}，未检测到策略冲突。"
        )


def _as_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _as_string_list(value: Any) -> List[str]:
    if not isinstance(value, Iterable) or isinstance(value, (str, bytes, dict)):
        return []
    return [str(item) for item in value if item is not None]


def _unique_ids(opinions: Iterable[StrategyOpinion]) -> List[str]:
    return _unique_strings(op.skill_id for op in opinions)


def _unique_strings(values: Iterable[str]) -> List[str]:
    result: List[str] = []
    for value in values:
        if value and value not in result:
            result.append(value)
    return result


def _highest_severity(conflicts: List[StrategyConflict]) -> str:
    if not conflicts:
        return "none"
    return max((conflict.severity for conflict in conflicts), key=lambda severity: _SEVERITY_RANK.get(severity, 0))


def _opinion_to_item(opinion: StrategyOpinion) -> Dict[str, Any]:
    return {
        "skill_id": opinion.skill_id,
        "agent_name": opinion.agent_name,
        "signal": opinion.signal,
        "confidence": round(opinion.confidence, 4),
        "reasoning": opinion.reasoning,
        "score_adjustment": opinion.score_adjustment,
        "conditions_met": opinion.conditions_met,
        "conditions_missed": opinion.conditions_missed,
    }


def _conflict_to_dict(conflict: StrategyConflict) -> Dict[str, Any]:
    return asdict(conflict)
