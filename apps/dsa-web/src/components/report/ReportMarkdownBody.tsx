import type React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportMarkdownBodyProps {
  content: string;
  className?: string;
  testId?: string;
}

type StrategySectionRange = {
  heading: string;
  body: string;
  start: number;
  end: number;
};

type StrategyItem = {
  label: string;
  value: string;
};

type StrategyChip = {
  skillId: string;
  signal: string;
  confidence: string;
};

const STRATEGY_SYNTHESIS_HEADING = '多策略综合';
const HEADING_PATTERN = /^#{1,6}\s+(.+?)\s*$/gm;

const STRATEGY_SKILL_LABELS: Record<string, string> = {
  bull_trend: '默认多头趋势',
  hot_theme: '热点题材',
  volume_breakout: '放量突破',
  ma_golden_cross: '均线金叉',
  growth_quality: '成长质量',
  bottom_volume: '底部放量',
  box_oscillation: '箱体震荡',
  chan_theory: '缠论结构',
  dragon_head: '龙头战法',
  emotion_cycle: '情绪周期',
  event_driven: '事件驱动',
  expectation_repricing: '预期重估',
  one_yang_three_yin: '一阳三阴',
  shrink_pullback: '缩量回踩',
  wave_theory: '波浪理论',
};

const STRATEGY_SIGNAL_LABELS: Record<string, string> = {
  strong_buy: '强烈买入',
  buy: '买入',
  hold: '持有',
  sell: '卖出',
  strong_sell: '强烈卖出',
};

const CONSENSUS_LEVEL_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const CONFLICT_SEVERITY_LABELS: Record<string, string> = {
  none: '无',
  low: '低',
  medium: '中',
  high: '高',
};

const normalizeToken = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '_');

const localizeMapValue = (value: string, labels: Record<string, string>): string => {
  const normalized = normalizeToken(value);
  return labels[normalized] || value;
};

const localizeStrategySkill = (value: string): string => localizeMapValue(value, STRATEGY_SKILL_LABELS);

const localizeStrategySignal = (value: string): string => localizeMapValue(value, STRATEGY_SIGNAL_LABELS);

const localizeStrategySummary = (value: string): string => value
  .replace(
    /Strategy synthesis from (\d+) skills: final signal is ([a-z_]+), consensus level is ([a-z_]+), with no detected conflicts\./gi,
    (_, count: string, signal: string, consensus: string) => (
      `来自 ${count} 个策略的综合判断：综合信号为${localizeStrategySignal(signal)}，共识度为${localizeMapValue(consensus, CONSENSUS_LEVEL_LABELS)}，未检测到策略冲突。`
    ),
  )
  .replace(
    /Strategy synthesis from (\d+) skills: final signal is ([a-z_]+), consensus level is ([a-z_]+), conflict severity is ([a-z_]+)\./gi,
    (_, count: string, signal: string, consensus: string, severity: string) => (
      `来自 ${count} 个策略的综合判断：综合信号为${localizeStrategySignal(signal)}，共识度为${localizeMapValue(consensus, CONSENSUS_LEVEL_LABELS)}，冲突强度为${localizeMapValue(severity, CONFLICT_SEVERITY_LABELS)}。`
    ),
  );

const localizeMetricPart = (part: string): string => {
  const normalized = normalizeToken(part);
  if (STRATEGY_SIGNAL_LABELS[normalized]) {
    return STRATEGY_SIGNAL_LABELS[normalized];
  }
  return part
    .replace(/综合信号:\s*([a-z_]+)/i, (_, signal: string) => `综合信号: ${localizeStrategySignal(signal)}`)
    .replace(/共识度:\s*([a-z_]+)/i, (_, level: string) => `共识度: ${localizeMapValue(level, CONSENSUS_LEVEL_LABELS)}`)
    .replace(/冲突:\s*([a-z_]+)/i, (_, severity: string) => `冲突: ${localizeMapValue(severity, CONFLICT_SEVERITY_LABELS)}`);
};

const findStrategySynthesisSection = (markdown: string): StrategySectionRange | null => {
  const matches = Array.from(markdown.matchAll(HEADING_PATTERN));
  const strategyHeading = matches.find((match) => match[1].includes(STRATEGY_SYNTHESIS_HEADING));
  if (!strategyHeading || strategyHeading.index === undefined) {
    return null;
  }

  const nextHeading = matches.find(
    (match) => match.index !== undefined && match.index > strategyHeading.index!,
  );
  const bodyStart = strategyHeading.index + strategyHeading[0].length;
  const bodyEnd = nextHeading?.index ?? markdown.length;

  return {
    heading: strategyHeading[1].trim(),
    body: markdown.slice(bodyStart, bodyEnd).trim(),
    start: strategyHeading.index,
    end: bodyEnd,
  };
};

const parseStrategyItems = (body: string): StrategyItem[] => body
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('- '))
  .map((line) => line.slice(2).trim())
  .map((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) {
      return { label: '', value: line };
    }
    return {
      label: line.slice(0, separatorIndex).trim(),
      value: line.slice(separatorIndex + 1).trim(),
    };
  });

const parseStrategyChips = (value: string): StrategyChip[] => value
  .split(/[、,，]/)
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => {
    const [skillId = '', signal = '', confidence = ''] = item.split('/').map((part) => part.trim());
    return { skillId, signal, confidence };
  })
  .filter((chip) => chip.skillId && chip.skillId !== '无');

const getStrategyChipTone = (signal: string): 'bull' | 'bear' | 'neutral' => {
  const normalized = normalizeToken(signal);
  if (normalized.includes('buy') || signal.includes('买入')) {
    return 'bull';
  }
  if (normalized.includes('sell') || signal.includes('卖出')) {
    return 'bear';
  }
  return 'neutral';
};

const renderStrategyChips = (value: string) => {
  const chips = parseStrategyChips(value);
  if (!chips.length) {
    return <span className="text-secondary-text">{value || '无'}</span>;
  }

  return (
    <div className="home-strategy-synthesis-chip-list">
      {chips.map((chip) => {
        const tone = getStrategyChipTone(chip.signal);
        return (
          <span
            className={`home-strategy-synthesis-chip home-strategy-synthesis-chip--${tone}`}
            key={`${chip.skillId}-${chip.signal}-${chip.confidence}`}
          >
            <span>{localizeStrategySkill(chip.skillId)}</span>
            {chip.signal ? <span className="home-strategy-synthesis-chip-sep">/</span> : null}
            {chip.signal ? <span>{localizeStrategySignal(chip.signal)}</span> : null}
            {chip.confidence ? <span className="home-strategy-synthesis-chip-sep">/</span> : null}
            {chip.confidence ? <span>{chip.confidence}</span> : null}
          </span>
        );
      })}
    </div>
  );
};

const renderStrategyMetrics = (value: string) => {
  const parts = value.split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return <span className="home-strategy-synthesis-metric">{localizeMetricPart(value)}</span>;
  }
  return (
    <div className="home-strategy-synthesis-metrics">
      {parts.map((part) => (
        <span className="home-strategy-synthesis-metric" key={part}>{localizeMetricPart(part)}</span>
      ))}
    </div>
  );
};

const renderStrategyValue = (item: StrategyItem) => {
  if (item.label.includes('综合信号')) {
    return renderStrategyMetrics(item.value);
  }
  if (item.label.includes('支持策略') || item.label.includes('反方策略')) {
    return renderStrategyChips(item.value);
  }
  return <span className="break-words text-foreground">{localizeStrategySummary(item.value)}</span>;
};

const StrategySynthesisBlock: React.FC<{ section: StrategySectionRange }> = ({ section }) => {
  const items = parseStrategyItems(section.body);
  return (
    <section className="home-strategy-synthesis-block" data-testid="strategy-synthesis-block">
      <h3>{section.heading}</h3>
      <ul className="home-strategy-synthesis-list">
        {items.map((item, index) => (
          <li className="home-strategy-synthesis-row" key={`${item.label}-${index}`}>
            {item.label ? <span className="home-strategy-synthesis-label">{item.label}</span> : null}
            <span className="home-strategy-synthesis-value">{renderStrategyValue(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const ReportMarkdownBody: React.FC<ReportMarkdownBodyProps> = ({
  content,
  className = '',
  testId,
}) => {
  const strategySection = findStrategySynthesisSection(content);
  const beforeStrategy = strategySection ? content.slice(0, strategySection.start).trimEnd() : content;
  const afterStrategy = strategySection ? content.slice(strategySection.end).trimStart() : '';

  return (
    <div
      data-testid={testId}
      className={`home-markdown-prose prose prose-invert prose-sm max-w-none
        prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
        prose-h1:text-xl
        prose-h2:text-lg
        prose-h3:text-base
        prose-p:leading-relaxed prose-p:mb-3 prose-p:last:mb-0
        prose-strong:text-foreground prose-strong:font-semibold
        prose-ul:my-2 prose-ol:my-2 prose-li:my-1
        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:border
        prose-table:border-collapse
        prose-hr:my-4
        prose-a:no-underline hover:prose-a:underline
        prose-blockquote:text-secondary-text
        whitespace-pre-line break-words
        ${className}
      `}
    >
      {beforeStrategy ? <Markdown remarkPlugins={[remarkGfm]}>{beforeStrategy}</Markdown> : null}
      {strategySection ? <StrategySynthesisBlock section={strategySection} /> : null}
      {afterStrategy ? <Markdown remarkPlugins={[remarkGfm]}>{afterStrategy}</Markdown> : null}
    </div>
  );
};
