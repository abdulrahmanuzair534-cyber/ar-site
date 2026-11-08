// High-yield conceptual SVG diagrams for flashcards and summaries

function encodeSvg(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const CAP_THEOREM_DIAGRAM = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
    <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="16" fill="url(#bg)"/>
  
  <text x="300" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="18" fill="#ffffff" letter-spacing="0.5">CAP THEOREM TRADE-OFF TRIANGLE</text>
  <text x="300" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">During an asynchronous network partition (P), pick Consistency (CP) or Availability (AP)</text>

  <!-- Triangle lines -->
  <polygon points="300,90 120,270 480,270" fill="none" stroke="#334155" stroke-width="3" stroke-dasharray="6 4"/>

  <!-- Top: Consistency (C) -->
  <circle cx="300" cy="90" r="32" fill="url(#cGrad)" filter="drop-shadow(0 4px 12px rgba(59,130,246,0.5))"/>
  <text x="300" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">C</text>
  <text x="300" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#93c5fd">Consistency</text>
  <text x="300" y="152" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#cbd5e1">Every read receives latest write</text>

  <!-- Left: Availability (A) -->
  <circle cx="120" cy="270" r="32" fill="url(#aGrad)" filter="drop-shadow(0 4px 12px rgba(16,185,129,0.5))"/>
  <text x="120" y="276" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">A</text>
  <text x="120" y="315" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#6ee7b7">Availability</text>
  <text x="120" y="328" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#cbd5e1">Non-error responses without fail</text>

  <!-- Right: Partition Tolerance (P) -->
  <circle cx="480" cy="270" r="32" fill="url(#pGrad)" filter="drop-shadow(0 4px 12px rgba(245,158,11,0.5))"/>
  <text x="480" y="276" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">P</text>
  <text x="480" y="315" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#fde68a">Partition Tolerance</text>
  <text x="480" y="328" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#cbd5e1">Network drops &amp; latency tolerance</text>

  <!-- Edge tags -->
  <rect x="150" y="155" width="90" height="24" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="195" y="171" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#60a5fa">CA (RDBMS)</text>

  <rect x="360" y="155" width="90" height="24" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="405" y="171" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#fbbf24">CP (etcd/Raft)</text>

  <rect x="255" y="258" width="90" height="24" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
  <text x="300" y="274" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#34d399">AP (Cassandra)</text>
</svg>
`);

export const RAFT_QUORUM_DIAGRAM = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
  <rect width="100%" height="100%" rx="16" fill="#090d16"/>
  <text x="300" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="16" fill="#ffffff">RAFT QUORUM CONSENSUS RULE (Q = floor(N/2) + 1)</text>
  <text x="300" y="56" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">5 Nodes cluster requires 3 active acks to commit a log entry</text>

  <!-- 5 Nodes in a circle -->
  <g transform="translate(110, 100)">
    <circle cx="40" cy="40" r="28" fill="#10b981" stroke="#34d399" stroke-width="3"/>
    <text x="40" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#ffffff">LEADER</text>
    <text x="40" y="50" text-anchor="middle" font-family="monospace" font-size="9" fill="#d1fae5">Node 1 [Ack]</text>
  </g>
  <g transform="translate(250, 80)">
    <circle cx="40" cy="40" r="28" fill="#1e293b" stroke="#10b981" stroke-width="2.5"/>
    <text x="40" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#ffffff">FOLLOWER</text>
    <text x="40" y="50" text-anchor="middle" font-family="monospace" font-size="9" fill="#34d399">Node 2 [Ack]</text>
  </g>
  <g transform="translate(390, 100)">
    <circle cx="40" cy="40" r="28" fill="#1e293b" stroke="#10b981" stroke-width="2.5"/>
    <text x="40" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#ffffff">FOLLOWER</text>
    <text x="40" y="50" text-anchor="middle" font-family="monospace" font-size="9" fill="#34d399">Node 3 [Ack]</text>
  </g>
  <g transform="translate(180, 190)">
    <circle cx="35" cy="35" r="24" fill="#334155" stroke="#ef4444" stroke-width="2"/>
    <text x="35" y="33" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fca5a5">DEAD</text>
    <text x="35" y="44" text-anchor="middle" font-family="monospace" font-size="8" fill="#cbd5e1">Node 4</text>
  </g>
  <g transform="translate(330, 190)">
    <circle cx="35" cy="35" r="24" fill="#334155" stroke="#ef4444" stroke-width="2"/>
    <text x="35" y="33" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fca5a5">DEAD</text>
    <text x="35" y="44" text-anchor="middle" font-family="monospace" font-size="8" fill="#cbd5e1">Node 5</text>
  </g>

  <!-- Status banner -->
  <rect x="150" y="260" width="300" height="26" rx="6" fill="#064e3b" stroke="#059669" stroke-width="1"/>
  <text x="300" y="277" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#a7f3d0">3/5 Quorum Achieved - Cluster Writes Proceed</text>
</svg>
`);

export const EV_BRIDGE_DIAGRAM = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
  <rect width="100%" height="100%" rx="16" fill="#0f172a"/>
  <text x="300" y="34" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="16" fill="#ffffff">ENTERPRISE VALUE (EV) WATERFALL BRIDGE</text>
  <text x="300" y="52" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">EV = Market Cap (Equity Value) + Debt + Preferred - Cash &amp; Equivalents</text>

  <!-- Waterfall bars -->
  <!-- 1. Market Cap -->
  <rect x="40" y="110" width="90" height="150" rx="8" fill="#3b82f6"/>
  <text x="85" y="100" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#93c5fd">$1,000M</text>
  <text x="85" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#ffffff">Equity Value</text>
  <text x="85" y="206" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#dbeafe">Market Cap</text>

  <!-- Plus -->
  <text x="145" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="extrabold" font-size="20" fill="#64748b">+</text>

  <!-- 2. Total Debt -->
  <rect x="165" y="150" width="80" height="110" rx="8" fill="#f59e0b"/>
  <text x="205" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#fde68a">+$350M</text>
  <text x="205" y="210" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#ffffff">Total Debt</text>
  <text x="205" y="225" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fef3c7">Senior/Mezz</text>

  <!-- Minus -->
  <text x="260" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="extrabold" font-size="20" fill="#64748b">-</text>

  <!-- 3. Cash & Equivalents -->
  <rect x="280" y="200" width="80" height="60" rx="8" fill="#10b981"/>
  <text x="320" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#6ee7b7">-$150M</text>
  <text x="320" y="235" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#ffffff">Cash</text>

  <!-- Equals -->
  <text x="380" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="extrabold" font-size="22" fill="#64748b">=</text>

  <!-- 4. Resulting Enterprise Value -->
  <rect x="405" y="80" width="150" height="180" rx="8" fill="#6366f1" stroke="#818cf8" stroke-width="2"/>
  <text x="480" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="extrabold" font-size="13" fill="#a5b4fc">EV = $1,200M</text>
  <text x="480" y="165" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#ffffff">ENTERPRISE VALUE</text>
  <text x="480" y="185" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#e0e7ff">Core Operating Asset Value</text>
  <text x="480" y="202" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#c7d2fe">Claims of all capital providers</text>

  <line x1="40" y1="260" x2="560" y2="260" stroke="#334155" stroke-width="2"/>
  <text x="300" y="295" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Terminal Value in DCF models represents ~65–80% of total calculated Enterprise Value</text>
</svg>
`);

export const RECEPTOR_SIGNALING_DIAGRAM = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
  <rect width="100%" height="100%" rx="16" fill="#090d16"/>
  <text x="300" y="32" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="16" fill="#ffffff">AUTONOMIC RECEPTOR SIGNALING PATHWAYS</text>
  <text x="300" y="50" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">G-Protein coupling: HAVe 1 M&amp;M (Gq) · MAD 2s (Gi) · Beta 1 &amp; 2 (Gs)</text>

  <!-- Alpha-1 Column -->
  <g transform="translate(30, 70)">
    <rect width="165" height="220" rx="10" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
    <text x="82" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#a5b4fc">Alpha-1 (Gq)</text>
    <rect x="25" y="45" width="115" height="24" rx="6" fill="#312e81"/>
    <text x="82" y="61" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#c7d2fe">Phospholipase C</text>
    
    <text x="82" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#e0e7ff">IP3 &amp; DAG surge</text>
    <text x="82" y="116" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#e0e7ff">&#8595; Intracellular Ca&#178;&#8314;</text>
    
    <rect x="15" y="140" width="135" height="60" rx="6" fill="#4338ca"/>
    <text x="82" y="158" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#ffffff">Clinical Effect:</text>
    <text x="82" y="174" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#e0e7ff">&#8226; Vasoconstriction</text>
    <text x="82" y="188" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#e0e7ff">&#8226; Pupillary dilation</text>
  </g>

  <!-- Beta-1 Column -->
  <g transform="translate(215, 70)">
    <rect width="165" height="220" rx="10" fill="#064e3b" stroke="#10b981" stroke-width="1.5"/>
    <text x="82" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#6ee7b7">Beta-1 (Gs)</text>
    <rect x="25" y="45" width="115" height="24" rx="6" fill="#065f46"/>
    <text x="82" y="61" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#a7f3d0">Adenylyl Cyclase</text>
    
    <text x="82" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#d1fae5">&#8593; Cyclic AMP (cAMP)</text>
    <text x="82" y="116" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#d1fae5">&#8593; Protein Kinase A</text>
    
    <rect x="15" y="140" width="135" height="60" rx="6" fill="#047857"/>
    <text x="82" y="158" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#ffffff">Cardiac (1 Heart):</text>
    <text x="82" y="174" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#d1fae5">&#8226; &#8593; Heart rate (Chronotropy)</text>
    <text x="82" y="188" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#d1fae5">&#8226; &#8593; Contractility (Inotropy)</text>
  </g>

  <!-- Beta-2 Column -->
  <g transform="translate(400, 70)">
    <rect width="165" height="220" rx="10" fill="#451a03" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="82" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#fde68a">Beta-2 (Gs)</text>
    <rect x="25" y="45" width="115" height="24" rx="6" fill="#78350f"/>
    <text x="82" y="61" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#fef3c7">Adenylyl Cyclase</text>
    
    <text x="82" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#fef3c7">&#8593; cAMP in Smooth Muscle</text>
    <text x="82" y="116" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#fef3c7">Inhibits Myosin Kinase</text>
    
    <rect x="15" y="140" width="135" height="60" rx="6" fill="#b45309"/>
    <text x="82" y="158" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#ffffff">Lungs (2 Lungs):</text>
    <text x="82" y="174" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fef3c7">&#8226; Bronchodilation</text>
    <text x="82" y="188" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fef3c7">&#8226; Skeletal muscle vasodilation</text>
  </g>
</svg>
`);
