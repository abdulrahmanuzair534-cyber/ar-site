import { SummaryDocument } from '../types/index';
import {
  CAP_THEOREM_DIAGRAM,
  RAFT_QUORUM_DIAGRAM,
  EV_BRIDGE_DIAGRAM,
  RECEPTOR_SIGNALING_DIAGRAM,
} from './diagrams';

export const SAMPLE_DECKS: SummaryDocument[] = [
  {
    id: 'sample-distributed-systems',
    title: 'Distributed Systems & High-Availability Architecture',
    coverImageUrl: CAP_THEOREM_DIAGRAM,
    sources: [
      {
        id: 'src-ddia',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        citation: "O'Reilly Media, Chapters 7–9 (Consensus, Linearizability & Replication)",
        type: 'book',
        url: 'https://dataintensive.net',
      },
      {
        id: 'src-mit6824',
        title: 'MIT 6.824: Distributed Systems',
        author: 'Robert Morris & Frans Kaashoek',
        citation: 'Lecture 3 & Raft Consensus Protocol Labs',
        type: 'lecture',
        url: 'https://pdos.csail.mit.edu/6.824/',
      },
      {
        id: 'src-cap-paper',
        title: "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services",
        author: 'Seth Gilbert & Nancy Lynch',
        citation: 'ACM SIGACT News, Vol. 33, No. 2, pp. 51-59',
        type: 'paper',
      },
    ],
    executiveBrief: 'Distributed systems trade off strict consistency for partition resilience and availability. Production architectures must design for partial network failure, implement idempotent writes, and select appropriate consensus mechanisms (Paxos/Raft) based on read/write latency SLAs.',
    keyTakeaways: [
      'CAP Theorem dictates that during a network partition, a system must choose either Consistency (CP) or Availability (AP); you cannot have both.',
      'PACELC extends CAP: even when no partition exists (Else), latency (L) must be balanced against consistency (C).',
      'Idempotency keys and event deduplication are mandatory primitives for at-least-once message delivery pipelines.',
      'Quorum consensus (Q = N/2 + 1) guarantees consistency across leader failovers without requiring all nodes to be online.',
      'Two-Phase Commit (2PC) is a blocking protocol that sacrifices availability for atomicity across heterogeneous databases.'
    ],
    coreConcepts: [
      {
        term: 'Split-Brain Scenario',
        definition: 'A condition where a cluster divides into two or more sub-clusters due to network partitioning, and multiple nodes assume leader status independently.',
        practicalApplication: 'Prevent by requiring a strict majority quorum (N/2 + 1) for write acceptance, or using an external fencing token mechanism.'
      },
      {
        term: 'Eventual Consistency',
        definition: 'A consistency model where all replicas will converge to identical state over time, provided no new updates are made.',
        practicalApplication: 'Ideal for shopping carts, feed counters, and notification feeds where sub-second global consistency is secondary to high write availability.'
      },
      {
        term: 'Vector Clocks',
        definition: 'An algorithm that tracks causality and partial ordering of distributed events across decentralized nodes without synchronized physical clocks.',
        practicalApplication: 'Used in Dynamo-style key-value stores (e.g. Cassandra, Riak) to detect concurrent conflicting writes.'
      }
    ],
    cheatSheet: [
      { item: 'Raft Quorum Rule', detail: 'Quorum = floor(N / 2) + 1 nodes must agree' },
      { item: '2PC Disadvantage', detail: 'Coordinator crash blocks all participating nodes indefinitely' },
      { item: 'AP Systems', detail: 'Cassandra, DynamoDB (eventual mode), CouchDB' },
      { item: 'CP Systems', detail: 'etcd, ZooKeeper, CockroachDB, Spanner' }
    ],
    actionItems: [
      'Audit microservice RPC timeouts and configure exponential backoff with jitter.',
      'Ensure all payment and order creation endpoints require client-generated idempotency keys.',
      'Test chaos partition failover in staging environment using network delay injection.'
    ],
    flashcards: [
      {
        id: 'ds-fc-1',
        question: 'What trade-off does the CAP theorem establish during a network partition?',
        answer: 'You must choose between Consistency (returning errors or waiting for all nodes) or Availability (returning stale data from accessible nodes).',
        mnemonic: 'CAP: In Partition (P), you can only pick C or A.',
        category: 'Architecture',
        difficulty: 'medium',
        imageUrl: CAP_THEOREM_DIAGRAM,
        imageCaption: 'CAP Theorem trade-off triangle during network partitions',
        sourceReference: 'Martin Kleppmann (DDIA, Chapter 8) & Gilbert/Lynch ACM Paper',
        box: 2,
        nextReviewDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        reviewCount: 1,
        correctCount: 1
      },
      {
        id: 'ds-fc-2',
        question: 'What is the PACELC theorem and how does it extend CAP?',
        answer: 'If there is a Partition (P), choose Availability (A) or Consistency (C); Else (E), choose Latency (L) or Consistency (C).',
        mnemonic: 'PAC-ELC: Normal operation trades speed (Latency) vs freshness (Consistency).',
        category: 'Architecture',
        difficulty: 'hard',
        sourceReference: 'Daniel Abadi (2012 PACELC formulation)',
        box: 1,
        nextReviewDate: new Date().toISOString(),
        reviewCount: 0,
        correctCount: 0
      },
      {
        id: 'ds-fc-3',
        question: 'Why are odd numbers of nodes (3, 5, 7) preferred in quorum-based clusters like Raft/Paxos?',
        answer: 'An odd number provides the same fault tolerance as the next even number (e.g., both 3 and 4 tolerate 1 failure), without the overhead of an extra node.',
        mnemonic: 'Odd avoids split ties; 3 handles 1 failure, 5 handles 2 failures.',
        category: 'Consensus',
        difficulty: 'medium',
        imageUrl: RAFT_QUORUM_DIAGRAM,
        imageCaption: 'Quorum Majority Rule Q = floor(N/2) + 1 in a 5-node cluster',
        sourceReference: 'Ongaro & Ousterhout (Raft Consensus Paper)',
        box: 3,
        nextReviewDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 2,
        correctCount: 2
      },
      {
        id: 'ds-fc-4',
        question: 'What is the purpose of an Idempotency Key in distributed HTTP APIs?',
        answer: 'It enables safe network retries: the server recognizes duplicate requests and returns the cached result without repeating the mutation.',
        mnemonic: 'Idem = "same"; doing the operation 100 times has the same effect as doing it once.',
        category: 'API Design',
        difficulty: 'easy',
        sourceReference: 'Stripe API Architecture & IETF Idempotency Key Specification',
        box: 4,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 4,
        correctCount: 4
      },
      {
        id: 'ds-fc-5',
        question: 'How does a Circuit Breaker pattern prevent cascading failures?',
        answer: 'It trips into an Open state when errors exceed a threshold, failing fast immediately instead of exhausting downstream connection pools.',
        mnemonic: 'Like an electrical breaker: trips instantly to prevent house fires from overloaded circuits.',
        category: 'Resilience',
        difficulty: 'easy',
        sourceReference: 'Michael Nygard (Release It! Design and Deploy Production-Ready Software)',
        box: 3,
        nextReviewDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 2,
        correctCount: 2
      }
    ],
    targetAudience: 'technical',
    createdAt: new Date().toISOString(),
    sourceWordCount: 1420,
    readingTimeMinutes: 5,
    tags: ['SystemDesign', 'CloudArchitecture', 'Backend']
  },
  {
    id: 'sample-corporate-finance',
    title: 'Executive Valuation, DCF & M&A Due Diligence',
    coverImageUrl: EV_BRIDGE_DIAGRAM,
    sources: [
      {
        id: 'src-damodaran',
        title: 'Investment Valuation: Tools and Techniques for Determining the Value of Any Asset',
        author: 'Aswath Damodaran (NYU Stern School of Business)',
        citation: 'Wiley Finance, 3rd Edition, Chapters 11–15',
        type: 'book',
        url: 'https://pages.stern.nyu.edu/~adamodar/',
      },
      {
        id: 'src-mckinsey',
        title: 'Valuation: Measuring and Managing the Value of Companies',
        author: 'Tim Koller, Marc Goedhart, David Wessels (McKinsey & Company)',
        citation: 'John Wiley & Sons, 7th Edition',
        type: 'book',
      },
      {
        id: 'src-hbs-note',
        title: 'Valuation of Cash Flows and Fundamental DCF Mechanics',
        author: 'Harvard Business School Publishing',
        citation: 'Case & Teaching Note 9-295-047',
        type: 'paper',
      },
    ],
    executiveBrief: 'Enterprise value represents the true economic cost to acquire a business regardless of capital structure. Discounted Cash Flow (DCF) models hinge on the Weighted Average Cost of Capital (WACC) and terminal growth rate assumptions, requiring sensitivity matrix checks against comparable company multiples.',
    keyTakeaways: [
      'Enterprise Value (EV) = Equity Value + Total Debt + Preferred Stock + Minority Interest - Cash & Cash Equivalents.',
      'Unlevered Free Cash Flow (FCFF) strips out interest expense to evaluate cash generated by core operations available to all capital providers.',
      'Terminal Value often represents 60%–80% of total DCF value, making Gordon Growth and Exit Multiple checks critical.',
      'WACC acts as the hurdle discount rate, reflecting the blended after-tax cost of equity (via CAPM) and cost of debt.',
      'Accretion/Dilution analysis determines whether buyer EPS increases or decreases post-acquisition.'
    ],
    coreConcepts: [
      {
        term: 'Weighted Average Cost of Capital (WACC)',
        definition: 'The average expected rate of return required by equity holders and debt providers, weighted by their respective market value proportions.',
        practicalApplication: 'Used as the discount rate to calculate present value of future projected cash flows in enterprise valuation.'
      },
      {
        term: 'Quality of Earnings (QoE)',
        definition: 'A due diligence analysis that normalizes reported EBITDA by stripping out one-time windfalls, owner perks, and non-recurring expenses.',
        practicalApplication: 'Protects buyers from paying inflated valuation multiples based on unsustainable earnings spikes.'
      },
      {
        term: 'Net Working Capital (NWC) Peg',
        definition: 'A negotiated target amount of working capital that the seller must deliver at closing; deficiencies result in purchase price deductions.',
        practicalApplication: 'Ensures the buyer does not inherit a business stripped of operating liquidity on day one.'
      }
    ],
    cheatSheet: [
      { item: 'EV Formula', detail: 'EV = Market Cap + Net Debt' },
      { item: 'CAPM Cost of Equity', detail: 'Ke = Rf + Beta * (Rm - Rf)' },
      { item: 'Perpetual Growth Formula', detail: 'TV = (Final Year FCF * (1 + g)) / (WACC - g)' },
      { item: 'Synergy Valuation', detail: 'Cost synergies are high probability; revenue synergies are speculative' }
    ],
    actionItems: [
      'Run a 2-way sensitivity table cross-tabulating WACC (±1%) against Terminal Growth Rate (±0.5%).',
      'Verify that stock-based compensation (SBC) is treated as a real economic expense in normalized EBITDA.',
      'Establish a working capital collar with 30-day post-closing adjustment rights.'
    ],
    flashcards: [
      {
        id: 'cf-fc-1',
        question: 'What is the formula for Enterprise Value (EV)?',
        answer: 'Enterprise Value = Equity Value (Market Cap) + Total Debt + Preferred Stock + Non-Controlling Interest - Cash and Cash Equivalents.',
        mnemonic: 'EV = "Everything you need to buy the company outright and clear its net debt".',
        category: 'Valuation',
        difficulty: 'easy',
        imageUrl: EV_BRIDGE_DIAGRAM,
        imageCaption: 'Enterprise Value Bridge from Market Capitalization to Net Debt',
        sourceReference: 'Aswath Damodaran (NYU Stern Valuation Guide)',
        box: 3,
        nextReviewDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 3,
        correctCount: 3
      },
      {
        id: 'cf-fc-2',
        question: 'Why do we use Unlevered Free Cash Flow (FCFF) instead of Levered Free Cash Flow (FCFE) when discounting at WACC?',
        answer: 'FCFF belongs to both debt and equity holders, so it must be discounted using a rate that reflects both (WACC). FCFE only belongs to equity holders and is discounted by Cost of Equity.',
        mnemonic: 'Unlevered matches Blended Cost (WACC); Levered matches Equity Cost alone.',
        category: 'DCF Modeling',
        difficulty: 'hard',
        sourceReference: 'McKinsey on Valuation (7th Edition)',
        box: 2,
        nextReviewDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        reviewCount: 1,
        correctCount: 1
      },
      {
        id: 'cf-fc-3',
        question: 'What does an M&A deal being "EPS Accretive" mean?',
        answer: "It means the combined company's projected Earnings Per Share is higher than the buyer's standalone EPS prior to the acquisition.",
        mnemonic: 'Accretive = Added value per share; Dilutive = Diluted / diminished share value.',
        category: 'M&A',
        difficulty: 'medium',
        sourceReference: 'Wall Street Prep M&A Accretion / Dilution Manual',
        box: 4,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 3,
        correctCount: 3
      },
      {
        id: 'cf-fc-4',
        question: 'What is a typical ceiling assumption for the long-term Terminal Growth Rate (g)?',
        answer: 'It should not exceed the long-term GDP growth rate of the economy (typically 2%–3%), otherwise the company would eventually become larger than the entire economy.',
        mnemonic: 'A company cannot permanently outgrow the planet (cap at GDP ~2-3%).',
        category: 'DCF Modeling',
        difficulty: 'medium',
        sourceReference: 'Damodaran on Valuation (Gordon Growth ceiling rule)',
        box: 3,
        nextReviewDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 2,
        correctCount: 2
      }
    ],
    targetAudience: 'executive',
    createdAt: new Date().toISOString(),
    sourceWordCount: 1680,
    readingTimeMinutes: 6,
    tags: ['CorporateFinance', 'PrivateEquity', 'Valuation']
  },
  {
    id: 'sample-medical-pharmacology',
    title: 'Autonomic Pharmacology: Adrenergic & Cholinergic Signaling',
    coverImageUrl: RECEPTOR_SIGNALING_DIAGRAM,
    sources: [
      {
        id: 'src-goodman',
        title: "Goodman & Gilman's The Pharmacological Basis of Therapeutics",
        author: 'Laurence Brunton, Randa Hilal-Dandan, Björn Knollmann',
        citation: 'McGraw-Hill, 14th Edition, Section II: Neuropharmacology',
        type: 'book',
      },
      {
        id: 'src-firstaid',
        title: 'First Aid for the USMLE Step 1',
        author: 'Tao Le, Vikas Bhushan',
        citation: 'Pharmacology Chapter: Autonomic Nervous System & Toxicology Tables',
        type: 'book',
      },
      {
        id: 'src-katzung',
        title: 'Basic & Clinical Pharmacology',
        author: 'Bertram G. Katzung, Todd W. Vanderah',
        citation: 'Lange / McGraw-Hill, 15th Edition, Chapters 6–10',
        type: 'book',
      },
    ],
    executiveBrief: 'The autonomic nervous system balances sympathetic (fight-or-flight; norepinephrine/epinephrine acting on alpha and beta receptors) and parasympathetic (rest-and-digest; acetylcholine acting on nicotinic and muscarinic receptors) tone to regulate hemodynamics, airway resistance, and visceral motility.',
    keyTakeaways: [
      'Alpha-1 receptors mediate vascular smooth muscle contraction and mydriasis via Gq coupling (IP3/DAG pathway).',
      'Beta-1 receptors are predominantly cardiac (increase heart rate and contractility) via Gs coupling (cAMP increase).',
      'Beta-2 receptors cause bronchodilation, uterine relaxation, and vasodilation in skeletal muscle via Gs stimulation.',
      'Organophosphate toxicity causes cholinergic crisis (SLUDGE/DUMBELS symptoms) by irreversibly inhibiting acetylcholinesterase.',
      'Atropine is a competitive muscarinic antagonist used to reverse severe symptomatic bradycardia and organophosphate poisoning.'
    ],
    coreConcepts: [
      {
        term: 'SLUDGE / DUMBELS Mnemonic',
        definition: 'Clinical signs of cholinergic excess: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis / Diarrhea, Urination, Miosis, Bradycardia, Emesis, Lacrimation, Salivation.',
        practicalApplication: 'Immediate recognition of cholinergic toxicity (organophosphates, sarin gas, or excessive myasthenia gravis treatment).'
      },
      {
        term: 'Epinephrine Reversal Phenomenon',
        definition: 'When epinephrine is administered after an alpha-blocker (like phentolamine), the alpha-mediated vasoconstriction is blocked, leaving Beta-2 vasodilation unmasked, causing blood pressure to drop rather than rise.',
        practicalApplication: 'Demonstrates competitive autonomic receptor physiology and pharmacological antagonism.'
      }
    ],
    cheatSheet: [
      { item: 'Beta-1 Location', detail: '1 Heart (cardiac inotropy & chronotropy)' },
      { item: 'Beta-2 Location', detail: '2 Lungs (bronchial smooth muscle dilation)' },
      { item: 'Alpha-1 G-Protein', detail: 'Gq (activates Phospholipase C -> IP3 & DAG)' },
      { item: 'Alpha-2 G-Protein', detail: 'Gi (inhibits adenylyl cyclase -> reduces sympathetic outflow)' }
    ],
    actionItems: [
      'Memorize G-protein pairings: HAVe 1 M&M (Gq: H1, A1, V1, M1, M3); MAD 2s (Gi: M2, A2, D2); rest are Gs.',
      'Review clinical indications for selective Beta-1 blockers (metoprolol) vs non-selective (propranolol in asthma contraindicated).'
    ],
    flashcards: [
      {
        id: 'med-fc-1',
        question: 'Which receptor and G-protein subunit mediates vascular smooth muscle contraction in response to norepinephrine?',
        answer: 'Alpha-1 adrenergic receptor via Gq protein (activates Phospholipase C to increase intracellular calcium).',
        mnemonic: 'Alpha-1 squeezes tight (Gq = Calcium flood).',
        category: 'Pharmacology',
        difficulty: 'medium',
        imageUrl: RECEPTOR_SIGNALING_DIAGRAM,
        imageCaption: 'Alpha-1 vs Beta-1 and Beta-2 Second Messenger Signaling Pathways',
        sourceReference: "Goodman & Gilman's Pharmacological Basis (Chapter 8)",
        box: 2,
        nextReviewDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        reviewCount: 1,
        correctCount: 1
      },
      {
        id: 'med-fc-2',
        question: 'Why are non-selective beta-blockers like propranolol contraindicated in patients with asthma or COPD?',
        answer: 'They block Beta-2 receptors in bronchial smooth muscle, preventing bronchodilation and provoking life-threatening bronchospasm.',
        mnemonic: 'Beta-2 is for 2 lungs: blocking it suffocates airflow.',
        category: 'Clinical Medicine',
        difficulty: 'easy',
        sourceReference: 'First Aid for the USMLE Step 1 (Autonomic Pharmacology)',
        box: 4,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        reviewCount: 3,
        correctCount: 3
      },
      {
        id: 'med-fc-3',
        question: 'What is the antidote for severe organophosphate insecticide poisoning, and what is its mechanism?',
        answer: 'Atropine (competitive muscarinic receptor antagonist to relieve bronchospasm and secretions) plus Pralidoxime/2-PAM (regenerates active acetylcholinesterase before aging occurs).',
        mnemonic: 'Atropine dries secretions; Pralidoxime frees the enzyme.',
        category: 'Toxicology',
        difficulty: 'hard',
        sourceReference: 'Goldfrank’s Toxicologic Emergencies & USMLE Board Review',
        box: 1,
        nextReviewDate: new Date().toISOString(),
        reviewCount: 0,
        correctCount: 0
      }
    ],
    targetAudience: 'medical',
    createdAt: new Date().toISOString(),
    sourceWordCount: 1540,
    readingTimeMinutes: 5,
    tags: ['Pharmacology', 'MedicalSchool', 'USMLE']
  }
];
