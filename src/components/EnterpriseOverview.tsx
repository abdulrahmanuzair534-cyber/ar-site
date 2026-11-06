import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Cpu,
  Layers,
  Award,
  Users,
  BrainCircuit,
  Building,
  CheckCircle2,
} from 'lucide-react';

interface EnterpriseOverviewProps {
  onLaunchGenerator: () => void;
  onExploreDecks: () => void;
  onOpenStudy: () => void;
}

export const EnterpriseOverview: React.FC<EnterpriseOverviewProps> = ({
  onLaunchGenerator,
  onExploreDecks,
  onOpenStudy,
}) => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Editorial kicker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <span>AR Site Enterprise Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-[1.12]">
              The Global Cognitive Synthesis & Accelerated Learning Engine.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed">
              AR Site deploys frontier AI to transform dense academic textbooks, executive whitepapers, and regulatory briefs into permanent, actionable knowledge with algorithmic spaced-repetition.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                onClick={onLaunchGenerator}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch AI Synthesis Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreDecks}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Explore Verified Study Decks</span>
              </button>
            </div>
          </div>

          {/* Featured Enterprise Campus Showcase Banner */}
          <div className="mt-14 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl relative group">
            <img
              src="/src/assets/images/ar_site_headquarters_clean_1793931417697.jpg"
              alt="AR Site Global World Headquarters Campus"
              className="w-full h-[320px] sm:h-[440px] lg:h-[500px] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
              <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1">
                AR Site Global Operations & Engineering Center
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display max-w-xl text-white">
                World-class research infrastructure powering enterprise cognitive synthesis across 140 countries.
              </h2>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                2.4M+
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Scholars & Executives
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                4.8×
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Retention Multiplier
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                99.98%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Enterprise Uptime SLA
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400 tabular-nums">
                140+
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Sovereign Jurisdictions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Enterprise Trust Logos */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
            Trusted by Leaders at Global Enterprises, Research Hospitals & Universities
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center opacity-70 hover:opacity-100 transition-opacity">
          <span className="font-display font-extrabold tracking-wider text-base text-slate-800 dark:text-slate-200">
            APEX GLOBAL
          </span>
          <span className="font-display font-extrabold tracking-wider text-base text-slate-800 dark:text-slate-200">
            VERTEX AI
          </span>
          <span className="font-display font-extrabold tracking-wider text-base text-slate-800 dark:text-slate-200">
            ILLUMINA BIO
          </span>
          <span className="font-display font-extrabold tracking-wider text-base text-slate-800 dark:text-slate-200">
            CITADEL ADV
          </span>
          <span className="font-display font-extrabold tracking-wider text-base text-slate-800 dark:text-slate-200">
            PALADIN SYS
          </span>
          <span className="font-display font-extrabold tracking-wider text-base text-slate-800 dark:text-slate-200">
            AURELIUS CORP
          </span>
        </div>
      </section>

      {/* Executive Leadership & Founder Spotlight */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 p-8 sm:p-12 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Founder Portrait (User's Uploaded Photo) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-800 opacity-30 group-hover:opacity-60 blur-lg transition-opacity duration-500" />
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 w-[280px] sm:w-[320px] aspect-square shadow-2xl bg-white dark:bg-slate-800">
                  <img
                    src="/assets/aistudio/photo_6240077634570227765_y_030423ca.jpg"
                    alt="Abdul Rahman - Founder & Chief Architect, AR Site"
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 text-white text-center">
                    <div className="font-display font-bold text-base">Abdul Rahman</div>
                    <div className="text-xs text-indigo-300 font-medium">Founder & Chief Architect</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leadership Vision & Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Executive Leadership · Office of the Founder</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                "Human potential should never be bottlenecked by how fast we can read or how easily we forget."
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                Under Abdul Rahman's vision, AR Site was architected to bridge the chasm between raw information overload and durable, permanent memory. By merging state-of-the-art multimodal AI synthesis with the neurobiology of the spacing effect and active recall, AR Site transforms multi-hour learning sessions into minutes of focused, high-yield cognitive mastery.
              </p>

              {/* Founder Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold block text-slate-900 dark:text-white">Precision Cognitive Synthesis</span>
                    Distills long-form material into executive BLUF and key takeaways.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold block text-slate-900 dark:text-white">Enterprise SM-2 Spaced Repetition</span>
                    Mathematical intervals optimized for rapid retention & recall.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Infrastructure & Systems Showcase (Bento Grid) */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Global Enterprise Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            The compute power, laboratories, and cognitive frameworks that make AR Site the preferred engine for enterprise teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Neural Datacenter */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/src/assets/images/ar_ai_neural_datacenter_1793930719778.jpg"
                  alt="AR Site Enterprise Neural Supercomputing Datacenter"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
                  Sovereign Cluster
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-1.5">
                  AI Supercomputing & Neural Inference
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sub-100ms multi-modal neural clusters designed to analyze voluminous regulatory, legal, and biomedical corpora into active-recall primitives.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Explore Supercomputing SLA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Research & Learning Labs */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/src/assets/images/ar_innovation_research_lab_1793930719941.jpg"
                  alt="AR Site Cognitive Learning Science Laboratory"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
                  Cognitive R&D
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-1.5">
                  Cognitive Science & Memory Labs
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Empirical calibration of memory retrieval cues, mnemonic anchors, and optimal Leitner spacing curves to maximize knowledge retention.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Read Cognitive Whitepapers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Global Boardroom & Advisory */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/src/assets/images/ar_global_summit_boardroom_1793930719705.jpg"
                  alt="AR Site Global Leadership Summit Boardroom"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
                  Executive Suite
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-1.5">
                  Executive Strategy & Compliance Briefs
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Rapid board-level briefing synthesis, financial M&A due diligence, and regulatory compliance acceleration for Fortune 500 executives.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Schedule Enterprise Advisory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Direct Call to Action */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="rounded-3xl p-8 sm:p-12 text-center text-white bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-800 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Ready to Accelerate Your Retention?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 font-sans leading-relaxed">
              Experience the AR Site cognitive synthesis engine with your own lecture notes, executive memos, or legal briefs right now.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onLaunchGenerator}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-indigo-900 font-semibold text-xs shadow-md hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <span>Open Generator</span>
              </button>
              <button
                onClick={onOpenStudy}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold text-xs border border-indigo-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Study Verified Flashcards</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
