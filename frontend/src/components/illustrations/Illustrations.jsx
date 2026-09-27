/* Custom CampusCoin illustrations — soft pastel educational-finance scenes.
   Pure SVG so they stay crisp, themable and dependency-free. */
export function HeroIllustration(){return <svg viewBox="0 0 340 268" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="ccHlScreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#eef7fb"/></linearGradient>
    <linearGradient id="ccHlCoin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#35d6a4"/><stop offset="1" stopColor="#14aed0"/></linearGradient>
    <linearGradient id="ccHlBars" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#9fe8cd"/><stop offset="1" stopColor="#39c8e0"/></linearGradient>
    <linearGradient id="ccHlLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#12b981"/><stop offset="1" stopColor="#22c3dd"/></linearGradient>
  </defs>
  <circle cx="252" cy="70" r="58" fill="#e9f6f1"/>
  <circle cx="86" cy="52" r="34" fill="#eaf3fb"/>
  <g className="cc-illust-float">
    <rect x="58" y="96" width="196" height="126" rx="14" fill="url(#ccHlScreen)" stroke="#d7e6f0" strokeWidth="2"/>
    <rect x="74" y="114" width="86" height="9" rx="4.5" fill="#dfeaf2"/>
    <rect x="74" y="130" width="56" height="7" rx="3.5" fill="#e9f1f7"/>
    <g>
      <rect x="82" y="176" width="13" height="26" rx="4" fill="url(#ccHlBars)"/>
      <rect x="103" y="162" width="13" height="40" rx="4" fill="url(#ccHlBars)"/>
      <rect x="124" y="170" width="13" height="32" rx="4" fill="url(#ccHlBars)"/>
      <rect x="145" y="150" width="13" height="52" rx="4" fill="url(#ccHlBars)"/>
    </g>
    <path d="M84 150 L110 140 L132 145 L158 128" stroke="url(#ccHlLine)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="158" cy="128" r="5" fill="#12b981"/>
    <g>
      <rect x="178" y="128" width="58" height="46" rx="10" fill="#ffffff" stroke="#d7e6f0" strokeWidth="2"/>
      <circle cx="196" cy="146" r="7" fill="#c9ecdd"/>
      <rect x="190" y="158" width="34" height="6" rx="3" fill="#e3eef6"/>
      <rect x="190" y="166" width="22" height="5" rx="2.5" fill="#edf4f9"/>
    </g>
  </g>
  <path d="M44 222 h224 a10 10 0 0 1 10 10 v4 a8 8 0 0 1 -8 8 H42 a8 8 0 0 1 -8 -8 v-4 a10 10 0 0 1 10 -10 z" fill="#e4eef6"/>
  <rect x="120" y="222" width="72" height="7" rx="3.5" fill="#cdddeb"/>
  <g className="cc-illust-float" style={{animationDelay:'-2.5s'}}>
    <circle cx="272" cy="96" r="30" fill="url(#ccHlCoin)"/>
    <circle cx="272" cy="96" r="23" fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="2.6 3.6"/>
    <path d="M264.4 103.4c1.7 2.2 4.4 3.5 7.3 3.5 4.6 0 7.6-2.5 7.6-5.9 0-3.1-2.2-4.9-7-5.9-4.2-.9-5.6-1.9-5.6-3.7 0-2 1.9-3.5 4.9-3.5 2.5 0 4.6 1 6.1 2.9l3.2-2.6c-1.8-2.5-4.8-4.1-8.1-4.3v-2.9h-3.4v2.9c-4.5.7-7.4 3.3-7.4 7.1 0 3.9 2.8 5.8 7.7 6.8 3.8.8 4.9 1.7 4.9 3.4 0 2-1.8 3.2-4.7 3.2-2.9 0-5.4-1.3-7-3.6z" fill="#fff" transform="translate(-1.8,-4.4) scale(.96) translate(6,6)"/>
  </g>
  <g>
    <path d="M132 88 l38 -13 38 13 -38 13 z" fill="#12403a"/>
    <path d="M148 96 v10 c0 5 10 9 22 9 s22 -4 22 -9 V96 l-22 8 z" fill="#1d5a4e"/>
    <path d="M196 92 l10 4 v12" stroke="#12403a" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="206" cy="110" r="2.6" fill="#12403a"/>
  </g>
  <g className="cc-illust-sway">
    <path d="M305 226 c0 -26 4 -44 4 -44 s-20 6 -22 26 c-1.4 13 6 22 10 24 z" fill="#9fdcc3"/>
    <path d="M309 226 c0 -30 -4 -52 -4 -52 s22 8 24 30 c1.2 14 -10 20 -12 22 z" fill="#7fd0b1"/>
    <path d="M298 226 h20 l-3 22 h-14 z" fill="#d9a679"/>
    <rect x="292" y="246" width="32" height="7" rx="3.5" fill="#c9946a"/>
  </g>
  <g className="cc-illust-float" style={{animationDelay:'-4s'}}>
    <rect x="22" y="196" width="46" height="12" rx="5" fill="#f3c98b"/>
    <rect x="28" y="182" width="42" height="12" rx="5" fill="#ef8f7c"/>
    <rect x="24" y="168" width="44" height="12" rx="5" fill="#7fc6e8"/>
  </g>
  <g fill="#12b981" opacity=".8">
    <path d="M318 150 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z"/>
    <path d="M36 130 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 z" fill="#22c3dd"/>
  </g>
</svg>;}
export function InsightIllustration(){return <svg viewBox="0 0 150 120" fill="none" aria-hidden="true">
  <defs><linearGradient id="ccBrainG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a689fb"/><stop offset="1" stopColor="#7a5af8"/></linearGradient></defs>
  <circle cx="75" cy="62" r="44" fill="#efeafd"/>
  <g className="cc-illust-float">
    <path d="M75 34 c-8 -8 -22 -6 -27 2 -6 -1 -12 4 -12 11 0 4 2 8 5 10 -2 3 -2 8 1 11 2 3 6 4 9 4 1 6 6 10 12 10 5 0 9 -2 12 -6 z" fill="url(#ccBrainG)" opacity=".92"/>
    <path d="M75 34 c8 -8 22 -6 27 2 6 -1 12 4 12 11 0 4 -2 8 -5 10 2 3 2 8 -1 11 -2 3 -6 4 -9 4 -1 6 -6 10 -12 10 -5 0 -9 -2 -12 -6 z" fill="url(#ccBrainG)"/>
    <path d="M75 36 v46" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7"/>
    <circle cx="75" cy="90" r="5" fill="#f2b64c"/>
    <rect x="70" y="96" width="10" height="4" rx="2" fill="#e8a63c"/>
  </g>
  <g fill="#8b72f6"><path d="M120 22 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 z"/><path d="M28 76 l1.6 3.8 3.8 1.6 -3.8 1.6 -1.6 3.8 -1.6 -3.8 -3.8 -1.6 3.8 -1.6 z" opacity=".7"/></g>
</svg>;}
export function EmptyArt({kind='doc'}){return <span className="empty-art" aria-hidden="true">
 {kind==='chart'?<svg width="72" height="58" viewBox="0 0 72 58" fill="none"><path d="M8 44 L24 32 L38 38 L62 16" stroke="#8bb9d6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 6"/><circle cx="62" cy="16" r="4" fill="#8bb9d6"/><rect x="8" y="48" width="56" height="3" rx="1.5" fill="#c9dcEA"/><rect x="8" y="48" width="56" height="3" rx="1.5" fill="#c9dcea"/></svg>
 :kind==='search'?<svg width="70" height="60" viewBox="0 0 70 60" fill="none"><circle cx="32" cy="26" r="16" stroke="#8bb9d6" strokeWidth="3.4"/><path d="M44 40 L56 52" stroke="#8bb9d6" strokeWidth="4" strokeLinecap="round"/><path d="M26 26 h12 M32 20 v12" stroke="#b7d3e6" strokeWidth="2.6" strokeLinecap="round"/></svg>
 :kind==='ring'?<svg width="66" height="66" viewBox="0 0 66 66" fill="none"><circle cx="33" cy="33" r="22" stroke="#c9dcea" strokeWidth="7" strokeDasharray="8 7" strokeLinecap="round"/><circle cx="33" cy="33" r="12" fill="#e7f1f9"/></svg>
 :<svg width="66" height="66" viewBox="0 0 66 66" fill="none"><rect x="14" y="8" width="38" height="50" rx="7" fill="#ffffff" stroke="#a9c9e0" strokeWidth="2.6"/><path d="M23 22 h20 M23 30 h20 M23 38 h12" stroke="#bcd6e9" strokeWidth="2.8" strokeLinecap="round"/><circle cx="44" cy="46" r="9" fill="#e9f6f1" stroke="#7fd0b1" strokeWidth="2.2"/><path d="M40.5 46 l2.6 2.6 4.6 -5" stroke="#12b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
</span>;}
export function AuthIllustration(){return <svg viewBox="0 0 460 330" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="ccAuCoin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#35d6a4"/><stop offset="1" stopColor="#14aed0"/></linearGradient>
    <linearGradient id="ccAuCard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#eaf5fb"/></linearGradient>
  </defs>
  <circle cx="240" cy="168" r="132" fill="#e8f3fb"/>
  <circle cx="240" cy="168" r="96" fill="#ddf0ea"/>
  <g className="cc-illust-float">
    <circle cx="240" cy="150" r="72" fill="url(#ccAuCoin)"/>
    <circle cx="240" cy="150" r="55" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2.4" strokeDasharray="4 6"/>
    <path d="M217 172 c4 5.4 10.6 8.6 17.6 8.6 11 0 18.2-6 18.2-14.2 0-7.4-5.3-11.7-16.8-14.1-10.1-2.2-13.4-4.6-13.4-8.9 0-4.8 4.6-8.4 11.8-8.4 6 0 11.1 2.4 14.7 7l7.7-6.2c-4.3-6-11.5-9.8-19.5-10.3v-7h-8.2v7c-10.8 1.7-17.8 7.9-17.8 17 0 9.4 6.7 13.9 18.5 16.4 9.1 1.9 11.8 4 11.8 8.1 0 4.7-4.3 7.7-11.3 7.7-7 0-12.9-3.1-16.8-8.7z" fill="#fff" transform="translate(-6,-12)"/>
  </g>
  <g className="cc-illust-float" style={{animationDelay:'-3s'}}>
    <rect x="52" y="118" width="110" height="66" rx="14" fill="url(#ccAuCard)" stroke="#d7e6f0" strokeWidth="2"/>
    <rect x="66" y="132" width="52" height="8" rx="4" fill="#dfeaf2"/>
    <rect x="66" y="148" width="82" height="7" rx="3.5" fill="#e9f1f7"/>
    <path d="M66 168 l18 -8 14 4 20 -10" stroke="#12b981" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
  </g>
  <g className="cc-illust-float" style={{animationDelay:'-1.5s'}}>
    <rect x="330" y="196" width="96" height="58" rx="14" fill="url(#ccAuCard)" stroke="#d7e6f0" strokeWidth="2"/>
    <circle cx="352" cy="222" r="10" fill="#c9ecdd"/>
    <rect x="368" y="212" width="44" height="6" rx="3" fill="#e3eef6"/>
    <rect x="368" y="224" width="30" height="6" rx="3" fill="#edf4f9"/>
    <rect x="344" y="238" width="64" height="6" rx="3" fill="#eef5fa"/>
  </g>
  <g>
    <path d="M130 258 h200" stroke="#cfe0ec" strokeWidth="6" strokeLinecap="round"/>
    <path d="M370 96 l2.6 6 6 2.6 -6 2.6 -2.6 6 -2.6 -6 -6 -2.6 6 -2.6 z" fill="#22c3dd"/>
    <path d="M96 84 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 z" fill="#12b981"/>
  </g>
</svg>;}
