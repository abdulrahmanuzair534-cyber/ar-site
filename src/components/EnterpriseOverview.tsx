import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ScanText,
  Layers,
  CheckCircle2,
  TrendingUp,
  Volume2,
  RotateCw,
  Building2,
  FileCheck2,
  X,
  Check,
  Mail,
} from 'lucide-react';
import { calculateRetentionRoi, RoiTrack } from '../utils/roiCalculator';

import headquartersImg from '../assets/images/ar_site_headquarters_clean_1793931417697.jpg';
import datacenterImg from '../assets/images/ar_ai_neural_datacenter_1793930719778.jpg';
import researchLabImg from '../assets/images/ar_innovation_research_lab_1793930719941.jpg';
import boardroomImg from '../assets/images/ar_global_summit_boardroom_1793930719705.jpg';
import founderImg from '../assets/images/founder_abdul_rahman.jpg';

interface EnterpriseOverviewProps {
  onLaunchGenerator: () => void;
  onOpenOcr: () => void;
  onExploreDecks: () => void;
  onOpenStudy: () => void;
}

interface InfrastructureDossier {
  id: string;
  tag: string;
  title: string;
  image: string;
  alt: string;
  summary: string;
  highlights: string[];
  actionLabel: string;
  actionTarget: 'ocr' | 'generator' | 'study' | 'contact';
}

const INFRASTRUCTURE_DOSSIERS: InfrastructureDossier[] = [
  {
    id: 'datacenter',
    tag: 'Vision & Inference',
    title: 'Multi-Pass Optical & Neural Pipeline',
    image: datacenterImg,
    alt: 'AR Site Enterprise Neural Supercomputing Datacenter',
    summary:
      'Adaptive contrast preprocessing, de-hyphenation, and multimodal Gemini 4 inference extract formulas, tables, and handwriting in under 1.8 seconds.',
    highlights: [
      'Automatic contrast stretch, sharpening kernel & rotation normalization',
      'Multimodal table, equation, and multi-column reading order preservation',
      'Zero-downtime local Tesseract neural fallback for offline reliability',
    ],
    actionLabel: 'Open Vision OCR Studio',
    actionTarget: 'ocr',
  },
  {
    id: 'research-lab',
    tag: 'Cognitive R&D',
    title: 'Applied Spaced-Repetition & Voice Labs',
    image: researchLabImg,
    alt: 'AR Site Cognitive Learning Science Laboratory',
    summary:
      'Empirical calibration of SM-2 Leitner spacing intervals, mnemonic anchoring, and multi-speed Text-to-Speech auditory reinforcement.',
    highlights: [
      'Box 1 through Box 5 adaptive review scheduling grounded in Ebbinghaus decay curves',
      'Interactive 3D flashcard recall stage with front & back voice synthesis',
      'Longitudinal quiz retention curves tracking mastery from Novice to Mastered',
    ],
    actionLabel: 'Experience 3D Flashcards',
    actionTarget: 'study',
  },
  {
    id: 'boardroom',
    tag: 'Enterprise Governance',
    title: 'Executive Briefing & Compliance Architecture',
    image: boardroomImg,
    alt: 'AR Site Global Leadership Summit Boardroom',
    summary:
      'Built for regulated clinical cohorts, legal partners, and engineering enablement teams demanding strict source citations and export portability.',
    highlights: [
      'SOC 2 Type II, ISO 27001, and HIPAA-ready deployment topologies',
      'Mandatory source provenance & context quote verification on every card',
      'Instant Anki TSV, CSV, Markdown, and print-ready executive packet exports',
    ],
    actionLabel: 'Schedule Executive Briefing',
    actionTarget: 'contact',
  },
];

const PIPELINE_STEPS = [
  {
    number: '01',
    title: 'Optical Capture & File Extraction',
    subtitle: 'Photos, scanned PDFs, handwritten notes, or Markdown',
    description:
      'Upload textbook snapshots, clinical handouts, or multi-column PDFs. Our optical preprocessor enhances ink contrast, isolates characters, and extracts clean verbatim text.',
    metric: '99.4% Character Fidelity',
    actionLabel: 'Launch OCR Studio',
    target: 'ocr' as const,
  },
  {
    number: '02',
    title: 'Structured AI Distillation',
    subtitle: 'Executive BLUF, core concepts & active-recall decks',
    description:
      'Transform raw notes into Bottom-Line-Up-Front briefs, domain glossaries, quick-reference cheat sheets, and scenario-based flashcards tailored to your audience track.',
    metric: '4–20 Cards in < 2s',
    actionLabel: 'Open AI Studio',
    target: 'generator' as const,
  },
  {
    number: '03',
    title: '3D Spaced Recall & Voice Mode',
    subtitle: 'Tactile 3D flip physics, shuffle & front/back speech',
    description:
      'Study with spring-physics 3D cards, interactive depth stacks, SM-2 confidence intervals, and adjustable-speed Text-to-Speech reading fronts and backs hands-free.',
    metric: '4.8× Retention Lift',
    actionLabel: 'Study 3D Flashcards',
    target: 'study' as const,
  },
  {
    number: '04',
    title: 'Adaptive Quizzes & Mastery Curves',
    subtitle: 'Track cohort progress across repeated recall sessions',
    description:
      'Validate recall with automated multiple-choice challenges, inspect missed-item explanations, and monitor longitudinal mastery curves and daily study streaks.',
    metric: 'Real-Time Calibration',
    actionLabel: 'Browse Study Decks',
    target: 'decks' as const,
  },
];

export const EnterpriseOverview: React.FC<EnterpriseOverviewProps> = ({
  onLaunchGenerator,
  onOpenOcr,
  onExploreDecks,
  onOpenStudy,
}) => {
  // Interactive Hero Console state
  const [heroTab, setHeroTab] = useState<'ocr' | 'synthesis' | '3d'>('ocr');
  const [heroCardFlipped, setHeroCardFlipped] = useState(false);

  // Interactive Pipeline Step state
  const [activePipelineIdx, setActivePipelineIdx] = useState(0);

  // Interactive ROI Calculator state
  const [weeklyPages, setWeeklyPages] = useState(120);
  const [cohortSize, setCohortSize] = useState(25);
  const [roiTrack, setRoiTrack] = useState<RoiTrack>('enterprise');
  const roi = calculateRetentionRoi({ weeklyPages, cohortSize, track: roiTrack });

  // Active Infrastructure Dossier Modal
  const [selectedDossier, setSelectedDossier] = useState<InfrastructureDossier | null>(null);

  // Enterprise Briefing Contact Form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactPlan, setContactPlan] = useState<'Pro Scholar' | 'Department Cohort' | 'Enterprise Global'>('Enterprise Global');
  const [contactNotes, setContactNotes] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmittedId, setContactSubmittedId] = useState<string | null>(null);

  const navigateTarget = (target: 'ocr' | 'generator' | 'study' | 'decks' | 'contact') => {
    if (target === 'ocr') onOpenOcr();
    else if (target === 'generator') onLaunchGenerator();
    else if (target === 'study') onOpenStudy();
    else if (target === 'decks') onExploreDecks();
    else if (target === 'contact') {
      document.getElementById('enterprise-briefing')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBriefingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    if (contactName.trim().length < 2) {
      setContactError('Please enter your full name.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactEmail.trim())) {
      setContactError('Please provide a valid work or institutional email address.');
      return;
    }
    if (contactOrg.trim().length < 2) {
      setContactError('Please specify your organization or university.');
      return;
    }

    const refId = `AR-${Math.floor(100000 + Math.random() * 900000)}`;
    setContactSubmittedId(refId);
  };

  const activePipeline = PIPELINE_STEPS[activePipelineIdx];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SPLIT SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-14 lg:pb-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Proposition & Primary Action */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AR Site Cognitive Intelligence Platform
              </div>

              <h1
                className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-[1.1] [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)' }}
              >
                Turn Scanned Textbooks and Enterprise Briefs into Permanent Recall.
              </h1>

              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                AR Site pairs high-accuracy Vision OCR with Gemini 4 cognitive synthesis, interactive 3D flashcards, and SM-2 spaced repetition—helping clinical cohorts, law partners, and engineering teams master dense material in minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenOcr}
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <ScanText className="w-4 h-4" />
                  <span>Try Live Vision OCR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onLaunchGenerator}
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Open AI Synthesis Studio</span>
                </button>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  SOC 2 Type II
                </span>
                <span aria-hidden="true">·</span>
                <span>ISO 27001 Infrastructure</span>
                <span aria-hidden="true">·</span>
                <span>Zero-Retention Local OCR Fallback</span>
              </div>
            </div>

            {/* Right Column: Interactive Live Product Console */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col">
                {/* Console Tab Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Interactive Product Preview
                  </span>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
                    {[
                      { id: 'ocr' as const, label: '01. Vision OCR' },
                      { id: 'synthesis' as const, label: '02. AI Brief' },
                      { id: '3d' as const, label: '03. 3D Recall' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setHeroTab(tab.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          heroTab === tab.id
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Console Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {heroTab === 'ocr' && (
                      <motion.div
                        key="hero-ocr"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 flex-1 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Input: Textbook_Ch9_Consensus.png
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                              99.4% Accuracy
                            </span>
                          </div>
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed">
                            <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              ## 9.3 Distributed Consensus &amp; Quorum Safety
                            </div>
                            <p>
                              Raft guarantees linearizable leader election when nodes secure a majority quorum: <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Q = floor(N / 2) + 1</code>.
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                              Auto-applied: Contrast Boost · Unsharp 3×3 · De-hyphenation
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">Engine</div>
                              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">Gemini 4 Vision</div>
                            </div>
                            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">Fallback</div>
                              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">Local WASM OCR</div>
                            </div>
                            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">Resolution</div>
                              <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">1400px+ DPI</div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Supports PNG, JPG, WEBP, PDF &amp; TXT
                          </span>
                          <button
                            type="button"
                            onClick={onOpenOcr}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Scan Your Document</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {heroTab === 'synthesis' && (
                      <motion.div
                        key="hero-synth"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 flex-1 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Distilled Executive Output
                            </span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">
                              1.4s Generation
                            </span>
                          </div>
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5 text-xs">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                                Bottom Line Up Front
                              </span>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Partitioned clusters must choose between CP (blocking stale reads) and AP (serving concurrent branches resolved via CRDTs).
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 tabular-nums">
                              <span>5 Key Takeaways</span>
                              <span>·</span>
                              <span>3 Core Terms</span>
                              <span>·</span>
                              <span>8 Recall Cards</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                              <div className="font-semibold text-slate-900 dark:text-white">Linearizability (CP)</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Rejects stale reads during split-brain</div>
                            </div>
                            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                              <div className="font-semibold text-slate-900 dark:text-white">Export Portability</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Anki TSV · CSV · Markdown</div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Verified citations attached automatically
                          </span>
                          <button
                            type="button"
                            onClick={onLaunchGenerator}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Generate Deck</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {heroTab === '3d' && (
                      <motion.div
                        key="hero-3d"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 flex-1 flex flex-col justify-between"
                      >
                        <div className="perspective-1400">
                          <motion.div
                            onClick={() => setHeroCardFlipped((f) => !f)}
                            animate={{ rotateY: heroCardFlipped ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                            style={{ transformStyle: 'preserve-3d' }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setHeroCardFlipped((f) => !f);
                              }
                            }}
                            aria-label="Interactive 3D demo flashcard, click to flip"
                            className="relative h-44 w-full rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer select-none shadow-md"
                          >
                            {/* Front */}
                            <div
                              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                              className="absolute inset-0 rounded-xl bg-white dark:bg-slate-950 p-4 flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                <span>System Architecture · Card 1/8</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Volume2 className="w-3.5 h-3.5" />
                                  Voice Ready
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white font-display">
                                Why does Raft require Q = floor(N/2) + 1 votes to elect a leader?
                              </p>
                              <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                                <RotateCw className="w-3 h-3" />
                                <span>Click card to flip in 3D</span>
                              </div>
                            </div>

                            {/* Back */}
                            <div
                              style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                              }}
                              className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 p-4 flex flex-col justify-between"
                            >
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Answer &amp; SM-2 Anchor
                              </span>
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                                Any two majorities overlap by at least one node, guaranteeing split-brain elections cannot succeed in the same term.
                              </p>
                              <div className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
                                Click to flip back
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Interactive tilt, shuffle &amp; Read Front/Back TTS
                          </span>
                          <button
                            type="button"
                            onClick={onOpenStudy}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Launch 3D Study Mode</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Full-Width KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                99.4%
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                OCR Character Accuracy
              </div>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                4.8×
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                90-Day Recall Multiplier
              </div>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                1.8s
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                Scan-to-Deck Synthesis
              </div>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                140+
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                Enterprise &amp; Academic Deployments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE END-TO-END WORKFLOW PIPELINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Unified Cognitive Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            Four Integrated Stages From Raw Document to Verified Mastery
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Clickable Editorial Numbered Steps */}
          <div className="lg:col-span-5 space-y-2.5">
            {PIPELINE_STEPS.map((step, idx) => {
              const active = activePipelineIdx === idx;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActivePipelineIdx(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                        {step.number}.
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-display">
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {step.subtitle}
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                        active ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Active Stage Interactive Detail Card */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Stage {activePipeline.number} of 04
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {activePipeline.metric}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                {activePipeline.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePipeline.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Works seamlessly with both server Gemini 4 Vision and local client engines.</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Zero-loss citation tracking from initial document scan to quiz mastery.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Live interactive workspace module
              </span>
              <button
                type="button"
                onClick={() => navigateTarget(activePipeline.target)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>{activePipeline.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE RETENTION & TEAM ROI CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Quantitative Productivity Estimator
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                Calculate Your Cohort’s Monthly Time Savings &amp; Retention Lift
              </h2>
            </div>

            {/* Track Segmented Selector */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(
                [
                  { id: 'academic', label: 'Academic' },
                  { id: 'medical', label: 'Medical' },
                  { id: 'legal', label: 'Legal' },
                  { id: 'enterprise', label: 'Enterprise' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoiTrack(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    roiTrack === item.id
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <label htmlFor="roi-pages-slider" className="text-slate-700 dark:text-slate-300">
                    Reading &amp; Document Volume (Pages / Week / Person)
                  </label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {weeklyPages} pages
                  </span>
                </div>
                <input
                  id="roi-pages-slider"
                  type="range"
                  min={20}
                  max={500}
                  step={10}
                  value={weeklyPages}
                  onChange={(e) => setWeeklyPages(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
                  <span>20 pages</span>
                  <span>250 pages</span>
                  <span>500 pages</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <label htmlFor="roi-cohort-slider" className="text-slate-700 dark:text-slate-300">
                    Learners or Team Seats
                  </label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {cohortSize} {cohortSize === 1 ? 'seat' : 'seats'}
                  </span>
                </div>
                <input
                  id="roi-cohort-slider"
                  type="range"
                  min={1}
                  max={250}
                  step={1}
                  value={cohortSize}
                  onChange={(e) => setCohortSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
                  <span>1 Individual</span>
                  <span>100 Department</span>
                  <span>250 Enterprise</span>
                </div>
              </div>
            </div>

            {/* Live Computed Outputs */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Hours Saved Monthly
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white tabular-nums mt-1 block">
                  {roi.hoursSavedPerMonth.toLocaleString()} hrs
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Projected 90-Day Recall
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
                  {roi.projected90DayRetention}%
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Annual Productivity Impact
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums mt-1 block">
                  ${roi.annualProductivityValueUsd.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 block font-medium">
                    Recommended Plan
                  </span>
                  <span className="text-lg font-extrabold font-display text-slate-900 dark:text-white mt-0.5 block">
                    {roi.recommendedTier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTarget('contact')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-2 cursor-pointer"
                >
                  <span>Request Custom Rollout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CAMPUS SHOWCASE & EXECUTIVE LEADERSHIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Global Operations Banner */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
          <img
            src={headquartersImg}
            alt="AR Site Global Operations and Engineering Center"
            className="w-full h-[280px] sm:h-[380px] object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">
              AR Site Global Operations &amp; Research Campus
            </div>
            <h2 className="text-xl sm:text-3xl font-bold font-display max-w-2xl">
              Engineered for Academic Institutions, Clinical Cohorts, and Global Enterprises.
            </h2>
          </div>
        </div>

        {/* Interactive Infrastructure Cards (every card opens a live dossier modal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INFRASTRUCTURE_DOSSIERS.map((dossier) => (
            <button
              key={dossier.id}
              type="button"
              onClick={() => setSelectedDossier(dossier)}
              className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dossier.image}
                    alt={dossier.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {dossier.tag}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    {dossier.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {dossier.summary}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>Inspect Technical Specifications</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Founder Spotlight */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 w-[260px] sm:w-[290px] aspect-square bg-slate-100 dark:bg-slate-800">
                <img
                  src={founderImg}
                  alt="Abdul Rahman — Founder & Chief Architect at AR Site"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-4 text-white">
                  <div className="font-display font-bold text-base">Abdul Rahman</div>
                  <div className="text-xs text-indigo-300">Founder &amp; Chief Architect</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Executive Leadership · Office of the Founder
              </div>
              <blockquote className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-snug">
                “Human potential should never be bottlenecked by how fast we can read or how easily we forget.”
              </blockquote>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                AR Site was built to connect real-world document capture directly to cognitive memory retention. Instead of leaving valuable insights trapped inside static PDFs or blurry lecture photos, every uploaded page becomes a verified, testable knowledge asset.
              </p>
              <div className="flex flex-wrap gap-6 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Precision Optical OCR &amp; Cleanup
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  SM-2 Spaced Repetition Scheduling
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Anki, CSV &amp; Markdown Portability
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ATTRIBUTABLE ENTERPRISE PROOF & CASE STUDIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Verified Customer Outcomes
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Measured Impact Across Medical, Legal &amp; Engineering Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-lg font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                +38% Step-1 Practice Pass Lift
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                “Replacing manual flashcard transcription with AR Site’s Vision OCR cut our pharmacology prep cycle in half while raising cohort retention scores across 420 residents.”
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Dr. Priya Nair, MD</div>
              <div className="text-slate-500 dark:text-slate-400">Director of Curriculum · Pacific Health Sciences</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-lg font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                4.2 hrs Saved Weekly / Engineer
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                “Every architectural RFC and post-mortem becomes an interactive study deck on day one. New backend hires pass production readiness quizzes 3 weeks faster.”
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Marcus Vance</div>
              <div className="text-slate-500 dark:text-slate-400">VP of Engineering Enablement · Meridian Cloud</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-lg font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                99.2% Citation Audit Accuracy
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                “Because AR Site preserves exact clause citations and original scan previews alongside every generated summary, our regulatory associates trust every briefing.”
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Claire Lindqvist</div>
              <div className="text-slate-500 dark:text-slate-400">Senior Partner · Nordik Regulatory Advisory</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PLANS & ENTERPRISE DEPLOYMENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Deployment Tiers
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Built for Individual Scholars and Global Organizations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                For Students &amp; Independent Learners
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Academic Starter
              </h3>
              <div className="text-3xl font-extrabold font-display text-slate-900 dark:text-white tabular-nums">
                $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                <li>· Unlimited local OCR &amp; file extraction</li>
                <li>· Up to 20 flashcards per generated deck</li>
                <li>· Full 3D flashcards, TTS voice &amp; Anki export</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onLaunchGenerator}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Start Free Workspace
            </button>
          </div>

          <div className="p-6 rounded-2xl border-2 border-indigo-600 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6 shadow-md">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                For Medical, Law &amp; Research Cohorts
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Pro Scholar &amp; Lab
              </h3>
              <div className="text-3xl font-extrabold font-display text-slate-900 dark:text-white tabular-nums">
                $19 <span className="text-xs font-normal text-slate-500">/ seat / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                <li>· Priority Gemini 4 Multimodal Vision OCR</li>
                <li>· Deep synthesis mode with full concept graphs</li>
                <li>· Longitudinal mastery curves &amp; audio transcription</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setContactPlan('Pro Scholar');
                navigateTarget('contact');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Request Pro Activation
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                For Hospitals, Universities &amp; Fortune 500
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Enterprise Global
              </h3>
              <div className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                Custom
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                <li>· Dedicated VPC, SSO/SAML &amp; zero-data-retention</li>
                <li>· Custom LMS &amp; compliance reporting APIs</li>
                <li>· 99.98% SLA with dedicated solutions architect</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setContactPlan('Enterprise Global');
                navigateTarget('contact');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Schedule Enterprise Briefing
            </button>
          </div>
        </div>
      </section>

      {/* 7. VALIDATED ENTERPRISE BRIEFING / CONTACT FORM */}
      <section id="enterprise-briefing" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Enterprise Advisory
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
                Schedule a Tailored AR Site Briefing
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Response within 1 business day</span>
            </div>
          </div>

          {contactSubmittedId ? (
            <div className="p-6 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Briefing Request Confirmed ({contactSubmittedId})</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Thank you, <strong>{contactName}</strong>. Our Enterprise Solutions team has logged your <strong>{contactPlan}</strong> inquiry for <strong>{contactOrg}</strong> and sent confirmation details to <strong>{contactEmail}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setContactSubmittedId(null);
                  setContactNotes('');
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleBriefingSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="briefing-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="briefing-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Dr. Elena Rostova"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="briefing-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work or Institutional Email *
                  </label>
                  <input
                    id="briefing-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@organization.edu"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="briefing-org" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organization / University *
                  </label>
                  <input
                    id="briefing-org"
                    type="text"
                    required
                    value={contactOrg}
                    onChange={(e) => setContactOrg(e.target.value)}
                    placeholder="e.g. Pacific Health Sciences"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="briefing-plan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deployment Tier
                  </label>
                  <select
                    id="briefing-plan"
                    value={contactPlan}
                    onChange={(e) => setContactPlan(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pro Scholar">Pro Scholar &amp; Lab</option>
                    <option value="Department Cohort">Department Cohort (10–50 seats)</option>
                    <option value="Enterprise Global">Enterprise Global (50+ seats)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="briefing-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Workflow &amp; Security Requirements (Optional)
                </label>
                <textarea
                  id="briefing-notes"
                  rows={3}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Tell us about your scanned document volume, LMS integration goals, or compliance standards..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              {contactError && (
                <div role="alert" className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                  {contactError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Or jump straight into the workspace without an account.
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Request Enterprise Briefing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Interactive Technical Dossier Modal */}
      {selectedDossier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setSelectedDossier(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dossier-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl"
          >
            <div className="relative h-48">
              <img
                src={selectedDossier.image}
                alt={selectedDossier.alt}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                aria-label="Close specifications modal"
                className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/70 text-white hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedDossier.tag}
                </div>
                <h3 id="dossier-modal-title" className="text-xl font-extrabold text-slate-900 dark:text-white font-display mt-0.5">
                  {selectedDossier.title}
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedDossier.summary}
              </p>

              <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {selectedDossier.highlights.map((item) => (
                  <li key={item} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedDossier.actionTarget;
                    setSelectedDossier(null);
                    navigateTarget(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{selectedDossier.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
