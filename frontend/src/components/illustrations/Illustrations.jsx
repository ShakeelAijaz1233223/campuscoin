/* Custom CampusCoin illustrations — premium blue/cyan/purple educational-finance
   scenes matching references #5/#6. Pure SVG, theme-aware via .illu-* classes,
   subtle float motion (disabled under prefers-reduced-motion). */

/* ---------- Dashboard hero: laptop, coins, grad cap, plant ---------- */
export function HeroIllustration(){return <svg viewBox="0 0 340 268" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="ccHlScreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#e9f0fe"/></linearGradient>
    <linearGradient id="ccHlCoin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd76b"/><stop offset="1" stopColor="#f0a13c"/></linearGradient>
    <linearGradient id="ccHlBars" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#93b6ff"/><stop offset="1" stopColor="#7c5cf6"/></linearGradient>
    <linearGradient id="ccHlLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3b7cf6"/><stop offset="1" stopColor="#22d3ee"/></linearGradient>
    <linearGradient id="ccHlLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4d8bff"/><stop offset="1" stopColor="#7c5cf6"/></linearGradient>
  </defs>
  <circle className="illu-halo" cx="252" cy="70" r="58"/>
  <circle className="illu-halo alt" cx="86" cy="52" r="34"/>
  <g className="cc-illust-float">
    <rect className="illu-panel" x="58" y="96" width="196" height="126" rx="14" strokeWidth="2"/>
    <rect className="illu-skel" x="74" y="114" width="86" height="9" rx="4.5"/>
    <rect className="illu-skel soft" x="74" y="130" width="56" height="7" rx="3.5"/>
    <g>
      <rect x="82" y="176" width="13" height="26" rx="4" fill="url(#ccHlBars)"/>
      <rect x="103" y="162" width="13" height="40" rx="4" fill="url(#ccHlBars)"/>
      <rect x="124" y="170" width="13" height="32" rx="4" fill="url(#ccHlBars)"/>
      <rect x="145" y="150" width="13" height="52" rx="4" fill="url(#ccHlBars)"/>
    </g>
    <path d="M84 150 L110 140 L132 145 L158 128" stroke="url(#ccHlLine)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="158" cy="128" r="5" fill="#3b7cf6"/>
    <g>
      <rect className="illu-panel" x="178" y="128" width="58" height="46" rx="10" strokeWidth="2"/>
      <circle cx="196" cy="146" r="7" fill="url(#ccHlLogo)"/>
      <rect className="illu-skel" x="190" y="158" width="34" height="6" rx="3"/>
      <rect className="illu-skel soft" x="190" y="166" width="22" height="5" rx="2.5"/>
    </g>
  </g>
  <path className="illu-base" d="M44 222 h224 a10 10 0 0 1 10 10 v4 a8 8 0 0 1 -8 8 H42 a8 8 0 0 1 -8 -8 v-4 a10 10 0 0 1 10 -10 z"/>
  <rect className="illu-skel" x="120" y="222" width="72" height="7" rx="3.5"/>
  <g className="cc-illust-float" style={{animationDelay:'-2.5s'}}>
    <circle cx="272" cy="96" r="30" fill="url(#ccHlCoin)"/>
    <circle cx="272" cy="96" r="23" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="1.6" strokeDasharray="2.6 3.6"/>
    <path d="M272.4 82.2v3.1c4.6.5 7.9 3.2 8.2 7h-4.6c-.3-1.7-1.7-2.9-3.6-3.2v6.3l1.9.4c4.3.9 6.9 3 6.9 6.6 0 4-3.2 6.6-8.8 7.1v3.1h-2.6v-3.1c-5-.5-8.5-3.3-8.8-7.5h4.6c.3 2 2 3.3 4.2 3.7v-6.6l-1.8-.4c-4.4-.9-6.8-3-6.8-6.5 0-3.8 3.1-6.4 8.6-6.9v-3.1h2.6z" fill="#fff" opacity=".95"/>
    <circle cx="296" cy="122" r="9" fill="url(#ccHlCoin)" opacity=".9"/>
    <circle cx="250" cy="128" r="6" fill="url(#ccHlCoin)" opacity=".75"/>
  </g>
  <g>
    <path d="M132 88 l38 -13 38 13 -38 13 z" fill="#1e2a55"/>
    <path d="M148 96 v10 c0 5 10 9 22 9 s22 -4 22 -9 V96 l-22 8 z" fill="#33437e"/>
    <path d="M196 92 l10 4 v12" stroke="#1e2a55" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="206" cy="110" r="2.6" fill="#1e2a55"/>
  </g>
  <g className="cc-illust-sway">
    <path d="M305 226 c0 -26 4 -44 4 -44 s-20 6 -22 26 c-1.4 13 6 22 10 24 z" fill="#7fd3c0"/>
    <path d="M309 226 c0 -30 -4 -52 -4 -52 s22 8 24 30 c1.2 14 -10 20 -12 22 z" fill="#57c2a8"/>
    <path d="M298 226 h20 l-3 22 h-14 z" fill="#d9a679"/>
    <rect x="292" y="246" width="32" height="7" rx="3.5" fill="#c9946a"/>
  </g>
  <g className="cc-illust-float" style={{animationDelay:'-4s'}}>
    <rect x="22" y="196" width="46" height="12" rx="5" fill="#f3c98b"/>
    <rect x="28" y="182" width="42" height="12" rx="5" fill="#8fa8ff"/>
    <rect x="24" y="168" width="44" height="12" rx="5" fill="#b49bff"/>
  </g>
  <g fill="#7c5cf6" opacity=".8">
    <path d="M318 150 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z"/>
    <path d="M36 130 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 z" fill="#22d3ee"/>
  </g>
</svg>;}

/* ---------- AI insight: brain in a glowing bulb inside a glass sphere ---------- */
export function InsightIllustration(){return <svg viewBox="0 0 150 120" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="ccBrainG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b5cf6"/><stop offset="1" stopColor="#3b7cf6"/></linearGradient>
    <radialGradient id="ccBulbG" cx=".4" cy=".3" r=".9"><stop offset="0" stopColor="#f472b6"/><stop offset=".55" stopColor="#8b5cf6"/><stop offset="1" stopColor="#3b7cf6"/></radialGradient>
  </defs>
  <circle className="illu-halo" cx="75" cy="62" r="44"/>
  <circle cx="75" cy="62" r="44" stroke="var(--accent-line)" strokeWidth="1" strokeDasharray="2 5" opacity=".8"/>
  <g className="cc-illust-float">
    <path d="M75 30 c-3 -6 -12 -7 -16 -2 -5 -2 -11 2 -11 8 0 3 1 5 3 7 -3 2 -4 5 -3 8 1 4 5 6 9 6 0 5 4 9 9 9 4 0 7 -2 9 -5 z" fill="url(#ccBrainG)" opacity=".92"/>
    <path d="M75 30 c3 -6 12 -7 16 -2 5 -2 11 2 11 8 0 3 -1 5 -3 7 3 2 4 5 3 8 -1 4 -5 6 -9 6 0 5 -4 9 -9 9 -4 0 -7 -2 -9 -5 z" fill="url(#ccBrainG)"/>
    <path d="M75 32 v34" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 6" opacity=".85"/>
    <path d="M66 74 h18 l-2 6 h-14 z" fill="#c3d4ff"/>
    <circle cx="75" cy="88" r="6.5" fill="url(#ccBulbG)"/>
    <rect x="69" y="95" width="12" height="4" rx="2" fill="#8fa8ff"/>
    <path d="M71 100 h8 l-1 3 h-6 z" fill="#6f8de8"/>
  </g>
  <g fill="#8b5cf6"><path d="M120 22 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 z"/><path d="M28 76 l1.6 3.8 3.8 1.6 -3.8 1.6 -1.6 3.8 -1.6 -3.8 -3.8 -1.6 3.8 -1.6 z" opacity=".7"/></g>
  <circle cx="118" cy="84" r="3" fill="#22d3ee" opacity=".8"/>
  <circle cx="30" cy="26" r="2.4" fill="#f472b6" opacity=".8"/>
</svg>;}

/* ---------- Empty-state artwork ---------- */
export function EmptyArt({kind='doc'}){return <span className="empty-art" aria-hidden="true">
 {kind==='chart'?<svg width="72" height="58" viewBox="0 0 72 58" fill="none"><path d="M8 44 L24 32 L38 38 L62 16" stroke="#7fa4e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 6"/><circle cx="62" cy="16" r="4" fill="#7fa4e8"/><rect x="8" y="48" width="56" height="3" rx="1.5" fill="#c3d2f0"/></svg>
 :kind==='search'?<svg width="70" height="60" viewBox="0 0 70 60" fill="none"><circle cx="32" cy="26" r="16" stroke="#7fa4e8" strokeWidth="3.4"/><path d="M44 40 L56 52" stroke="#7fa4e8" strokeWidth="4" strokeLinecap="round"/><path d="M26 26 h12 M32 20 v12" stroke="#a9c0ee" strokeWidth="2.6" strokeLinecap="round"/></svg>
 :kind==='ring'?<svg width="86" height="86" viewBox="0 0 86 86" fill="none">
   <defs><linearGradient id="ccRingG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b7cf6"/><stop offset=".55" stopColor="#22d3ee"/><stop offset="1" stopColor="#7c5cf6"/></linearGradient></defs>
   <circle cx="43" cy="43" r="30" stroke="url(#ccRingG)" strokeWidth="9" strokeLinecap="round" strokeDasharray="128 61" transform="rotate(-90 43 43)"/>
   <circle cx="43" cy="43" r="30" stroke="var(--border)" strokeWidth="9" strokeDasharray="3 8" opacity=".7"/>
   <g className="cc-illust-float">
     <ellipse cx="43" cy="52" rx="13" ry="4.5" fill="#f0a13c"/>
     <ellipse cx="43" cy="47" rx="13" ry="4.5" fill="#ffc75e"/>
     <ellipse cx="43" cy="42" rx="13" ry="4.5" fill="#ffd76b"/>
     <ellipse cx="43" cy="37" rx="13" ry="4.5" fill="#ffe08f"/>
   </g>
   <circle cx="76" cy="18" r="3" fill="#7c5cf6" opacity=".7"/><circle cx="10" cy="64" r="2.4" fill="#22d3ee" opacity=".8"/>
  </svg>
 :<svg width="66" height="66" viewBox="0 0 66 66" fill="none"><rect className="illu-panel" x="14" y="8" width="38" height="50" rx="7" strokeWidth="2.6"/><path d="M23 22 h20 M23 30 h20 M23 38 h12" stroke="#a9c0ee" strokeWidth="2.8" strokeLinecap="round"/><circle cx="44" cy="46" r="9" fill="#e8effe" stroke="#3b7cf6" strokeWidth="2.2"/><path d="M40.5 46 l2.6 2.6 4.6 -5" stroke="#3b7cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
</span>;}

/* ---------- Auth page: coin + dashboard cards ---------- */
export function AuthIllustration(){return <svg viewBox="0 0 460 330" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="ccAuCoin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4d8bff"/><stop offset="1" stopColor="#7c5cf6"/></linearGradient>
    <linearGradient id="ccAuCard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#e9f0fe"/></linearGradient>
  </defs>
  <circle className="illu-halo" cx="240" cy="168" r="132"/>
  <circle className="illu-halo alt" cx="240" cy="168" r="96"/>
  <g className="cc-illust-float">
    <circle cx="240" cy="150" r="72" fill="url(#ccAuCoin)"/>
    <circle cx="240" cy="150" r="55" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2.4" strokeDasharray="4 6"/>
    <path d="M217 172 c4 5.4 10.6 8.6 17.6 8.6 11 0 18.2-6 18.2-14.2 0-7.4-5.3-11.7-16.8-14.1-10.1-2.2-13.4-4.6-13.4-8.9 0-4.8 4.6-8.4 11.8-8.4 6 0 11.1 2.4 14.7 7l7.7-6.2c-4.3-6-11.5-9.8-19.5-10.3v-7h-8.2v7c-10.8 1.7-17.8 7.9-17.8 17 0 9.4 6.7 13.9 18.5 16.4 9.1 1.9 11.8 4 11.8 8.1 0 4.7-4.3 7.7-11.3 7.7-7 0-12.9-3.1-16.8-8.7z" fill="#fff" transform="translate(-6,-12)"/>
  </g>
  <g className="cc-illust-float" style={{animationDelay:'-3s'}}>
    <rect x="52" y="118" width="110" height="66" rx="14" fill="url(#ccAuCard)" stroke="#cfdcf5" strokeWidth="2"/>
    <rect x="66" y="132" width="52" height="8" rx="4" fill="#dfe7f6"/>
    <rect x="66" y="148" width="82" height="7" rx="3.5" fill="#e9effb"/>
    <path d="M66 168 l18 -8 14 4 20 -10" stroke="#3b7cf6" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
  </g>
  <g className="cc-illust-float" style={{animationDelay:'-1.5s'}}>
    <rect x="330" y="196" width="96" height="58" rx="14" fill="url(#ccAuCard)" stroke="#cfdcf5" strokeWidth="2"/>
    <circle cx="352" cy="222" r="10" fill="#c9d8ff"/>
    <rect x="368" y="212" width="44" height="6" rx="3" fill="#e3eaf8"/>
    <rect x="368" y="224" width="30" height="6" rx="3" fill="#edf2fb"/>
    <rect x="344" y="238" width="64" height="6" rx="3" fill="#eef3fb"/>
  </g>
  <g>
    <path d="M130 258 h200" stroke="#cfdcf5" strokeWidth="6" strokeLinecap="round"/>
    <path d="M370 96 l2.6 6 6 2.6 -6 2.6 -2.6 6 -2.6 -6 -6 -2.6 6 -2.6 z" fill="#22d3ee"/>
    <path d="M96 84 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 z" fill="#7c5cf6"/>
  </g>
</svg>;}
