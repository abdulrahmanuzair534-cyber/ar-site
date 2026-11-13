import React, { useState, useEffect } from 'react';
import { SummaryDocument } from '../types/index';
import {
  calculateDeckMasteryStats,
  QUIZ_PROGRESS_UPDATED_EVENT,
  DeckMasteryStats,
} from '../utils/quizProgressService';
import {
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';

interface DeckMasteryChartProps {
  document: SummaryDocument;
  onTakeQuiz: () => void;
}

export const DeckMasteryChart: React.FC<DeckMasteryChartProps> = ({
  document,
  onTakeQuiz,
}) => {
  const [stats, setStats] = useState<DeckMasteryStats>(() =>
    calculateDeckMasteryStats(document.id)
  );
  const [hoveredAttemptIdx, setHoveredAttemptIdx] = useState<number | null>(null);

  // Sync stats when deck changes or a quiz attempt completes
  useEffect(() => {
    const updateStats = () => {
      setStats(calculateDeckMasteryStats(document.id));
    };

    updateStats();

    window.addEventListener(QUIZ_PROGRESS_UPDATED_EVENT, updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener(QUIZ_PROGRESS_UPDATED_EVENT, updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, [document.id]);

  const attempts = stats.attempts;
  const hasAttempts = attempts.length > 0;

  // Calculate Leitner Box Distribution from flashcards
  const totalCards = document.flashcards.length;
  const boxCounts = [1, 2, 3, 4, 5].map(
    (b) => document.flashcards.filter((c) => c.box === b).length
  );

  // SVG Chart Geometry Constants
  const svgWidth = 520;
  const svgHeight = 160;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 30;
  const chartInnerWidth = svgWidth - padLeft - padRight;
  const chartInnerHeight = svgHeight - padTop - padBottom;

  // Compute points for SVG trend chart
  const points = attempts.map((a, idx) => {
    const x =
      attempts.length === 1
        ? padLeft + chartInnerWidth / 2
        : padLeft + (idx / (attempts.length - 1)) * chartInnerWidth;
    const y = padTop + chartInnerHeight - (a.percentage / 100) * chartInnerHeight;
    return { x, y, attempt: a };
  });

  const pathD =
    points.length > 1
      ? points.reduce(
          (acc, pt, idx) =>
            idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
          ''
        )
      : points.length === 1
      ? `M ${padLeft} ${points[0].y} L ${padLeft + chartInnerWidth} ${points[0].y}`
      : '';

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${padTop + chartInnerHeight} L ${
          points[0].x
        } ${padTop + chartInnerHeight} Z`
      : '';

  // Mastery Tier Color and Icon formatting
  const getBadgeConfig = (level: string) => {
    switch (level) {
      case 'Mastered':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
          desc: 'High-retention memory consolidation verified',
        };
      case 'Proficient':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
          dot: 'bg-indigo-500',
          desc: 'Consistent accuracy across recall challenges',
        };
      case 'Competent':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
          dot: 'bg-blue-500',
          desc: 'Solid foundation; review difficult cards in Box 1 & 2',
        };
      case 'Novice':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
          dot: 'bg-amber-500',
          desc: 'Early acquisition phase; recommend active review',
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
          dot: 'bg-slate-400',
          desc: 'Take your first quiz challenge to calibrate mastery score',
        };
    }
  };

  const badge = getBadgeConfig(stats.masteryLevel);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
      {/* Header with Title, Badge, and Quiz Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white font-display">
              Cognitive Mastery &amp; Retention Curve
            </h2>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {stats.masteryLevel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {badge.desc}
          </p>
        </div>

        <button
          type="button"
          onClick={onTakeQuiz}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{hasAttempts ? 'Retake Quiz Challenge' : 'Take Calibration Quiz'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* Main Grid: Circular Gauge + Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Circular Progress Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Donut / Radial Ring */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={301.6}
                strokeDashoffset={
                  301.6 - (301.6 * (hasAttempts ? stats.masteryPercentage : 0)) / 100
                }
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                {hasAttempts ? `${stats.masteryPercentage}%` : '--'}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Mastery Score
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
            {hasAttempts ? (
              <span>
                Based on <strong className="text-indigo-600 dark:text-indigo-400">{stats.totalQuizzesTaken}</strong> past quiz challenge{stats.totalQuizzesTaken === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-slate-400">Quiz unassessed</span>
            )}
          </div>
        </div>

        {/* Right Column: Historical Performance Trend Chart */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Quiz Retention History</span>
              {hasAttempts && (
                <span className="text-[10px] text-slate-400 font-normal">
                  (Chronological sessions)
                </span>
              )}
            </span>

            {hasAttempts && (
              <span className="text-[11px] text-slate-400 font-mono">
                Benchmark: 80% Recall Threshold
              </span>
            )}
          </div>

          {/* SVG Line / Area Graph */}
          {hasAttempts ? (
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-2 overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-40 overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines & labels */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = padTop + chartInnerHeight - (val / 100) * chartInnerHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={padLeft + chartInnerWidth}
                        y2={y}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeDasharray={val === 80 ? '3 3' : val === 0 ? '' : '2 2'}
                        strokeWidth={val === 80 ? '1.5' : '1'}
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 3}
                        className="fill-slate-400 text-[10px] font-mono text-right"
                        textAnchor="end"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark threshold line (80%) */}
                <line
                  x1={padLeft}
                  y1={padTop + chartInnerHeight - 0.8 * chartInnerHeight}
                  x2={padLeft + chartInnerWidth}
                  y2={padTop + chartInnerHeight - 0.8 * chartInnerHeight}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.6"
                />

                {/* Area Gradient Fill */}
                {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                {/* Connecting Trend Line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Data Point Dots */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredAttemptIdx === idx;
                  return (
                    <g
                      key={pt.attempt.id || idx}
                      onMouseEnter={() => setHoveredAttemptIdx(idx)}
                      onMouseLeave={() => setHoveredAttemptIdx(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        className="fill-white dark:fill-slate-900 stroke-indigo-600 dark:stroke-indigo-400 transition-all"
                        strokeWidth="2.5"
                      />
                      <text
                        x={pt.x}
                        y={padTop + chartInnerHeight + 18}
                        className="fill-slate-400 text-[10px] font-mono"
                        textAnchor="middle"
                      >
                        #{idx + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip callout when hovering a data point */}
              {hoveredAttemptIdx !== null && points[hoveredAttemptIdx] && (
                <div
                  className="absolute z-10 -top-2 transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] shadow-lg pointer-events-none whitespace-nowrap border border-slate-700"
                  style={{
                    left: `${(points[hoveredAttemptIdx].x / svgWidth) * 100}%`,
                  }}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Attempt #{hoveredAttemptIdx + 1}:</span>
                    <span className="text-amber-400">
                      {points[hoveredAttemptIdx].attempt.percentage}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {points[hoveredAttemptIdx].attempt.score} of{' '}
                    {points[hoveredAttemptIdx].attempt.totalQuestions} questions correct
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No quiz sessions recorded for this deck yet.
              </p>
              <button
                type="button"
                onClick={onTakeQuiz}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
              >
                <span>Take Active Recall Quiz (2 min)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Metrics Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Latest Score
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-display">
                {stats.latestScore !== null ? `${stats.latestScore}%` : '--'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Personal Best
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
                {stats.bestScore !== null ? `${stats.bestScore}%` : '--'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Average Score
              </span>
              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 font-display">
                {stats.averageScore !== null ? `${stats.averageScore}%` : '--'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Sessions
              </span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-display">
                {stats.totalQuizzesTaken}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leitner Spaced-Repetition Box Distribution */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Leitner Spaced-Repetition Distribution ({totalCards} Cards)</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Box 1 (Daily) → Box 5 (Mastered 30d)
          </span>
        </div>

        {/* Segmented Stacked Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {boxCounts.map((count, idx) => {
            if (count === 0 || totalCards === 0) return null;
            const pct = (count / totalCards) * 100;
            const colors = [
              'bg-red-500', // Box 1
              'bg-amber-500', // Box 2
              'bg-blue-500', // Box 3
              'bg-indigo-500', // Box 4
              'bg-emerald-500', // Box 5
            ];
            return (
              <div
                key={idx}
                style={{ width: `${pct}%` }}
                className={`${colors[idx]} h-full transition-all duration-300`}
                title={`Box ${idx + 1}: ${count} card${count === 1 ? '' : 's'} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          {[
            { label: 'Box 1 (1d)', count: boxCounts[0], color: 'bg-red-500' },
            { label: 'Box 2 (3d)', count: boxCounts[1], color: 'bg-amber-500' },
            { label: 'Box 3 (7d)', count: boxCounts[2], color: 'bg-blue-500' },
            { label: 'Box 4 (14d)', count: boxCounts[3], color: 'bg-indigo-500' },
            { label: 'Box 5 (30d)', count: boxCounts[4], color: 'bg-emerald-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span>
                {item.label}: <strong>{item.count}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
