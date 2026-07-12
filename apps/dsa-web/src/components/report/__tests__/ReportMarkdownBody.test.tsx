import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportMarkdownBody } from '../ReportMarkdownBody';

const STRATEGY_SYNTHESIS_MARKDOWN = [
  '## 🎯 信号归因分析',
  '',
  '- 技术指标: 60%',
  '- 新闻情感: 25%',
  '',
  '## 🧩 多策略综合',
  '',
  '- 综合信号: 持有 | 共识度: 高 | 冲突: 无 (0) | 置信度: 41%',
  '- 综合说明: 来自 3 个策略的综合判断：综合信号为持有，共识度为高，未检测到策略冲突。',
  '- 支持策略: bull_trend/持有/48%、hot_theme/持有/35%、volume_breakout/持有/38%',
  '- 反方策略: 无',
  '- high: 趋势与题材冲突',
].join('\n');

describe('ReportMarkdownBody', () => {
  it('用结构化卡片渲染多策略综合段落', () => {
    const { container } = render(<ReportMarkdownBody content={STRATEGY_SYNTHESIS_MARKDOWN} />);

    expect(screen.getByTestId('strategy-synthesis-block')).toBeInTheDocument();
    expect(screen.getByText('综合信号')).toBeInTheDocument();
    expect(screen.getByText('支持策略')).toBeInTheDocument();

    const chips = container.querySelectorAll('.home-strategy-synthesis-chip');
    expect(chips).toHaveLength(3);
    expect(chips[0].textContent).toContain('默认多头趋势');
    expect(chips[0].textContent).toContain('持有');
    expect(chips[0].textContent).toContain('48%');
  });

  it('兜底本地化旧报告中的英文 summary 和策略 ID', () => {
    const { container } = render(<ReportMarkdownBody content={[
      '## 🧩 多策略综合',
      '',
      '- 综合信号: hold | 共识度: high | 冲突: none (0) | 置信度: 41%',
      '- 综合说明: Strategy synthesis from 3 skills: final signal is hold, consensus level is high, with no detected conflicts.',
      '- 支持策略: bull_trend/hold/48%、hot_theme/hold/35%、volume_breakout/hold/38%',
      '- 反方策略: 无',
    ].join('\n')} />);

    expect(screen.getByText('来自 3 个策略的综合判断：综合信号为持有，共识度为高，未检测到策略冲突。')).toBeInTheDocument();
    expect(container.textContent).toContain('默认多头趋势/持有/48%');
    expect(container.textContent).toContain('热点题材/持有/35%');
    expect(container.textContent).toContain('放量突破/持有/38%');
    expect(container.textContent).not.toContain('Strategy synthesis from');
    expect(container.textContent).not.toContain('bull_trend/hold');
  });
});
