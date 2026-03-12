/**
 * ═══════════════════════════════════════════════════════════════
 * ABU ABED BOX - SVG ILLUSTRATION ENGINE
 * Generates rich SVG scene illustrations for game card banners,
 * boot screen mascot, victory screen, and lobby decorations
 * ═══════════════════════════════════════════════════════════════
 */

const GameIllustrations = (() => {

  /* ─── SVG Scenes per Game ─── */
  const scenes = {

    quiplash: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ql-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD93D" stop-opacity=".9"/><stop offset="100%" stop-color="#FF6B6B" stop-opacity=".7"/></linearGradient>
        <filter id="ql-glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Speech bubbles -->
      <rect x="40" y="30" width="100" height="55" rx="18" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <polygon points="90,85 100,105 110,85" fill="rgba(255,255,255,0.2)"/>
      <rect x="180" y="50" width="100" height="55" rx="18" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <polygon points="220,105 230,125 240,105" fill="rgba(255,255,255,0.15)"/>
      <!-- Lightning bolt -->
      <path d="M155,15 L145,65 L160,60 L148,110 L175,50 L158,55 Z" fill="url(#ql-g1)" filter="url(#ql-glow)">
        <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite"/>
      </path>
      <!-- Laugh lines -->
      <text x="60" y="62" fill="rgba(255,255,255,0.7)" font-size="16" font-weight="900" font-family="sans-serif">😂 !!</text>
      <text x="200" y="82" fill="rgba(255,255,255,0.6)" font-size="14" font-weight="900" font-family="sans-serif">🤣 !!!</text>
      <!-- Stars -->
      <circle cx="30" cy="20" r="2" fill="#FFD93D" opacity=".6"><animate attributeName="opacity" values=".3;1;.3" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="290" cy="30" r="3" fill="#FFD93D" opacity=".8"><animate attributeName="opacity" values=".5;1;.5" dur="1.8s" repeatCount="indefinite"/></circle>
      <circle cx="270" cy="130" r="2" fill="#fff" opacity=".5"><animate attributeName="opacity" values=".2;.8;.2" dur="2.5s" repeatCount="indefinite"/></circle>
    </svg>`,

    guesspionage: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gs-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C8A951" stop-opacity=".6"/><stop offset="100%" stop-color="#006C35" stop-opacity=".3"/></linearGradient>
      </defs>
      <!-- Grid lines (spy data) -->
      <g stroke="rgba(200,169,81,0.15)" stroke-width="1">
        <line x1="0" y1="40" x2="320" y2="40"/><line x1="0" y1="80" x2="320" y2="80"/><line x1="0" y1="120" x2="320" y2="120"/>
        <line x1="80" y1="0" x2="80" y2="160"/><line x1="160" y1="0" x2="160" y2="160"/><line x1="240" y1="0" x2="240" y2="160"/>
      </g>
      <!-- Pie chart -->
      <circle cx="160" cy="80" r="45" fill="none" stroke="rgba(200,169,81,0.3)" stroke-width="3"/>
      <circle cx="160" cy="80" r="45" fill="none" stroke="url(#gs-g)" stroke-width="8" stroke-dasharray="180 283" stroke-dashoffset="-40" stroke-linecap="round">
        <animate attributeName="stroke-dasharray" values="100 283;200 283;100 283" dur="4s" repeatCount="indefinite"/>
      </circle>
      <!-- Percentage -->
      <text x="160" y="88" text-anchor="middle" fill="#C8A951" font-size="28" font-weight="900" font-family="sans-serif" opacity=".9">67%</text>
      <!-- Spy silhouette -->
      <g transform="translate(50,35)" opacity=".25">
        <circle cx="15" cy="12" r="10" fill="#C8A951"/>
        <rect x="5" y="22" width="20" height="30" rx="5" fill="#C8A951"/>
        <rect x="3" y="8" width="24" height="8" rx="3" fill="#1a1a1a"/>
      </g>
      <!-- Magnifying glass -->
      <g transform="translate(240,90)" opacity=".3">
        <circle cx="0" cy="0" r="18" fill="none" stroke="#C8A951" stroke-width="3"/>
        <line x1="13" y1="13" x2="28" y2="28" stroke="#C8A951" stroke-width="3" stroke-linecap="round"/>
      </g>
      <!-- Scan line -->
      <rect x="0" y="0" width="320" height="3" fill="rgba(200,169,81,0.15)">
        <animate attributeName="y" values="0;157;0" dur="4s" repeatCount="indefinite"/>
      </rect>
    </svg>`,

    fakinit: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fk-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E8A317" stop-opacity=".7"/><stop offset="100%" stop-color="#FF6B6B" stop-opacity=".5"/></linearGradient>
      </defs>
      <!-- Suspicious eyes -->
      <g transform="translate(110,40)">
        <ellipse cx="30" cy="30" rx="28" ry="18" fill="rgba(255,255,255,0.15)" stroke="rgba(232,163,23,0.4)" stroke-width="2"/>
        <ellipse cx="80" cy="30" rx="28" ry="18" fill="rgba(255,255,255,0.15)" stroke="rgba(232,163,23,0.4)" stroke-width="2"/>
        <circle cx="33" cy="30" r="8" fill="rgba(232,163,23,0.8)">
          <animate attributeName="cx" values="28;38;28" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="83" cy="30" r="8" fill="rgba(232,163,23,0.8)">
          <animate attributeName="cx" values="78;88;78" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="33" cy="29" r="3" fill="#000">
          <animate attributeName="cx" values="28;38;28" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="83" cy="29" r="3" fill="#000">
          <animate attributeName="cx" values="78;88;78" dur="3s" repeatCount="indefinite"/>
        </circle>
      </g>
      <!-- Question marks floating -->
      <text x="50" y="50" fill="rgba(232,163,23,0.4)" font-size="32" font-weight="900">?</text>
      <text x="260" y="70" fill="rgba(232,163,23,0.3)" font-size="24" font-weight="900">?</text>
      <text x="40" y="130" fill="rgba(255,255,255,0.2)" font-size="20" font-weight="900">?</text>
      <text x="275" y="140" fill="rgba(255,255,255,0.15)" font-size="28" font-weight="900">?</text>
      <!-- Pointing finger -->
      <g transform="translate(140,100)" opacity=".35">
        <path d="M0,20 L30,0 L32,8 L55,8 L55,22 L32,22 L30,30 Z" fill="url(#fk-g)"/>
      </g>
    </svg>`,

    triviamurder: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="tm-glow"><feGaussianBlur stdDeviation="4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="tm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B8860B" stop-opacity=".8"/><stop offset="100%" stop-color="#8B2252" stop-opacity=".6"/></linearGradient>
      </defs>
      <!-- Skull -->
      <g transform="translate(120,15)" filter="url(#tm-glow)">
        <ellipse cx="40" cy="35" rx="35" ry="30" fill="rgba(184,134,11,0.2)" stroke="rgba(184,134,11,0.5)" stroke-width="2"/>
        <rect x="15" y="55" width="50" height="15" rx="3" fill="rgba(184,134,11,0.15)"/>
        <!-- Eyes -->
        <ellipse cx="28" cy="32" rx="8" ry="9" fill="rgba(139,34,82,0.6)"/>
        <ellipse cx="52" cy="32" rx="8" ry="9" fill="rgba(139,34,82,0.6)"/>
        <!-- Nose -->
        <path d="M37,42 L43,42 L40,47 Z" fill="rgba(139,34,82,0.4)"/>
        <!-- Teeth -->
        <g fill="rgba(184,134,11,0.3)">
          <rect x="24" y="56" width="6" height="10" rx="1"/><rect x="32" y="56" width="6" height="10" rx="1"/>
          <rect x="40" y="56" width="6" height="10" rx="1"/><rect x="48" y="56" width="6" height="10" rx="1"/>
        </g>
      </g>
      <!-- Candles -->
      <g opacity=".5">
        <rect x="45" y="90" width="8" height="40" rx="2" fill="rgba(184,134,11,0.3)"/>
        <ellipse cx="49" cy="88" rx="6" ry="8" fill="#B8860B" opacity=".7">
          <animate attributeName="ry" values="8;10;8" dur="1s" repeatCount="indefinite"/>
        </ellipse>
        <rect x="267" y="85" width="8" height="45" rx="2" fill="rgba(184,134,11,0.3)"/>
        <ellipse cx="271" cy="83" rx="6" ry="8" fill="#B8860B" opacity=".7">
          <animate attributeName="ry" values="8;10;8" dur="1.2s" repeatCount="indefinite"/>
        </ellipse>
      </g>
      <!-- Blood drips -->
      <circle cx="80" cy="140" r="4" fill="rgba(139,34,82,0.3)"><animate attributeName="cy" values="130;145;130" dur="3s" repeatCount="indefinite"/></circle>
      <circle cx="240" cy="135" r="3" fill="rgba(139,34,82,0.25)"><animate attributeName="cy" values="125;140;125" dur="3.5s" repeatCount="indefinite"/></circle>
    </svg>`,

    fibbage: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fb-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#DAA520" stop-opacity=".7"/><stop offset="100%" stop-color="#B8860B" stop-opacity=".5"/></linearGradient>
      </defs>
      <!-- Theater masks -->
      <g transform="translate(80,25)" opacity=".8">
        <!-- Happy mask -->
        <ellipse cx="40" cy="45" rx="35" ry="40" fill="rgba(218,165,32,0.2)" stroke="rgba(218,165,32,0.5)" stroke-width="2"/>
        <circle cx="28" cy="35" r="6" fill="rgba(218,165,32,0.4)"/>
        <circle cx="52" cy="35" r="6" fill="rgba(218,165,32,0.4)"/>
        <path d="M25,55 Q40,72 55,55" fill="none" stroke="rgba(218,165,32,0.5)" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g transform="translate(175,35)" opacity=".6">
        <!-- Sad mask -->
        <ellipse cx="40" cy="45" rx="35" ry="40" fill="rgba(184,134,11,0.15)" stroke="rgba(184,134,11,0.4)" stroke-width="2"/>
        <circle cx="28" cy="35" r="6" fill="rgba(184,134,11,0.3)"/>
        <circle cx="52" cy="35" r="6" fill="rgba(184,134,11,0.3)"/>
        <path d="M25,65 Q40,48 55,65" fill="none" stroke="rgba(184,134,11,0.4)" stroke-width="3" stroke-linecap="round"/>
      </g>
      <!-- Sparkles -->
      <circle cx="50" cy="30" r="3" fill="#DAA520" opacity=".5"><animate attributeName="opacity" values=".2;.8;.2" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="280" cy="50" r="2" fill="#DAA520" opacity=".6"><animate attributeName="opacity" values=".3;.9;.3" dur="1.5s" repeatCount="indefinite"/></circle>
      <circle cx="160" cy="140" r="2.5" fill="#fff" opacity=".4"><animate attributeName="opacity" values=".2;.7;.2" dur="2.2s" repeatCount="indefinite"/></circle>
    </svg>`,

    drawful: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="df-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00BFA5" stop-opacity=".7"/><stop offset="50%" stop-color="#4facfe" stop-opacity=".5"/><stop offset="100%" stop-color="#00f2fe" stop-opacity=".6"/>
        </linearGradient>
      </defs>
      <!-- Canvas/easel -->
      <rect x="90" y="20" width="140" height="110" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <!-- Scribble art on canvas -->
      <path d="M110,60 Q130,30 150,65 T190,55 T210,70" fill="none" stroke="rgba(0,191,165,0.5)" stroke-width="3" stroke-linecap="round">
        <animate attributeName="d" values="M110,60 Q130,30 150,65 T190,55 T210,70;M110,65 Q130,40 155,60 T185,50 T210,65;M110,60 Q130,30 150,65 T190,55 T210,70" dur="4s" repeatCount="indefinite"/>
      </path>
      <circle cx="140" cy="85" r="15" fill="rgba(79,172,254,0.3)"/>
      <circle cx="170" cy="90" r="10" fill="rgba(0,242,254,0.3)"/>
      <!-- Paint brush -->
      <g transform="translate(240,50) rotate(30)">
        <rect x="0" y="0" width="8" height="50" rx="2" fill="rgba(139,69,19,0.5)"/>
        <rect x="-3" y="-15" width="14" height="18" rx="3" fill="rgba(0,191,165,0.6)"/>
      </g>
      <!-- Paint splatters -->
      <circle cx="50" cy="40" r="12" fill="rgba(0,191,165,0.2)"/>
      <circle cx="55" cy="45" r="6" fill="rgba(79,172,254,0.2)"/>
      <circle cx="275" cy="120" r="10" fill="rgba(0,242,254,0.15)"/>
      <circle cx="60" cy="120" r="8" fill="rgba(255,107,107,0.15)"/>
    </svg>`,

    tshirtwars: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <!-- T-shirt shape -->
      <g transform="translate(95,15)" opacity=".8">
        <path d="M30,0 L0,25 L20,40 L20,110 L110,110 L110,40 L130,25 L100,0 Q80,15 65,15 Q50,15 30,0 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linejoin="round"/>
        <!-- Star on shirt -->
        <polygon points="65,45 72,62 90,62 76,74 80,92 65,82 50,92 54,74 40,62 58,62" fill="rgba(255,107,53,0.4)" stroke="rgba(255,107,53,0.6)" stroke-width="1">
          <animate attributeName="opacity" values=".6;1;.6" dur="2s" repeatCount="indefinite"/>
        </polygon>
      </g>
      <!-- Floating design elements -->
      <circle cx="40" cy="50" r="4" fill="rgba(108,52,131,0.4)"><animate attributeName="cy" values="50;40;50" dur="3s" repeatCount="indefinite"/></circle>
      <rect x="270" y="80" width="15" height="15" rx="2" fill="rgba(255,107,53,0.25)" transform="rotate(20,277,87)"/>
      <polygon points="45,120 50,110 55,120" fill="rgba(255,107,53,0.3)"/>
    </svg>`,

    trynottolol: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="tntl-glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Laughing face -->
      <g transform="translate(110,15)" filter="url(#tntl-glow)">
        <circle cx="50" cy="50" r="45" fill="rgba(255,215,0,0.2)" stroke="rgba(255,215,0,0.4)" stroke-width="2"/>
        <!-- Eyes squeezed shut from laughing -->
        <path d="M30,40 Q35,35 40,40" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-linecap="round"/>
        <path d="M60,40 Q65,35 70,40" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-linecap="round"/>
        <!-- Wide open laughing mouth -->
        <path d="M30,60 Q50,85 70,60" fill="rgba(255,215,0,0.3)" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
        <!-- Tear drops -->
        <circle cx="25" cy="45" r="3" fill="rgba(0,229,255,0.4)"><animate attributeName="cy" values="45;55;45" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle cx="75" cy="45" r="3" fill="rgba(0,229,255,0.4)"><animate attributeName="cy" values="45;55;45" dur="1.8s" repeatCount="indefinite"/></circle>
      </g>
      <!-- Floating LOL text -->
      <text x="40" y="50" font-size="16" opacity=".3" fill="#FFD700" font-weight="bold">LOL</text>
      <text x="250" y="40" font-size="12" opacity=".25" fill="#FFD700">😂<animate attributeName="y" values="40;30;40" dur="2s" repeatCount="indefinite"/></text>
      <text x="50" y="140" font-size="14" opacity=".2" fill="#FFD700">🤣</text>
      <text x="260" y="130" font-size="10" opacity=".3" fill="#FFD700">HAHA<animate attributeName="y" values="130;120;130" dur="2.5s" repeatCount="indefinite"/></text>
    </svg>`,

    inventions: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="inv-glow"><feGaussianBlur stdDeviation="4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Lightbulb -->
      <g transform="translate(130,10)" filter="url(#inv-glow)">
        <ellipse cx="30" cy="40" rx="28" ry="32" fill="rgba(0,229,255,0.2)" stroke="rgba(0,229,255,0.5)" stroke-width="2"/>
        <rect x="18" y="68" width="24" height="15" rx="3" fill="rgba(0,229,255,0.15)" stroke="rgba(0,229,255,0.3)" stroke-width="1.5"/>
        <!-- Filament -->
        <path d="M25,55 Q30,35 35,55" fill="none" stroke="rgba(255,217,61,0.6)" stroke-width="2">
          <animate attributeName="opacity" values=".5;1;.5" dur="1.5s" repeatCount="indefinite"/>
        </path>
        <!-- Light rays -->
        <line x1="30" y1="0" x2="30" y2="-12" stroke="rgba(0,229,255,0.3)" stroke-width="2" stroke-linecap="round"/>
        <line x1="55" y1="15" x2="65" y2="8" stroke="rgba(0,229,255,0.25)" stroke-width="2" stroke-linecap="round"/>
        <line x1="5" y1="15" x2="-5" y2="8" stroke="rgba(0,229,255,0.25)" stroke-width="2" stroke-linecap="round"/>
      </g>
      <!-- Gears -->
      <g transform="translate(45,85)" opacity=".3">
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0,229,255,0.5)" stroke-width="3" stroke-dasharray="8 6">
          <animateTransform attributeName="transform" type="rotate" values="0 20 20;360 20 20" dur="8s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g transform="translate(235,75)" opacity=".25">
        <circle cx="20" cy="20" r="22" fill="none" stroke="rgba(2,119,189,0.5)" stroke-width="3" stroke-dasharray="10 7">
          <animateTransform attributeName="transform" type="rotate" values="360 20 20;0 20 20" dur="10s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>`,

    wouldyourather: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Split line -->
      <line x1="160" y1="10" x2="160" y2="150" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="8 4"/>
      <!-- Left arrow -->
      <g transform="translate(40,50)" opacity=".6">
        <polygon points="50,0 0,30 50,60" fill="rgba(255,111,0,0.4)" stroke="rgba(255,193,7,0.5)" stroke-width="2"/>
        <text x="15" y="37" fill="rgba(255,255,255,0.7)" font-size="20" font-weight="900">A</text>
      </g>
      <!-- Right arrow -->
      <g transform="translate(230,50)" opacity=".6">
        <polygon points="0,0 50,30 0,60" fill="rgba(255,193,7,0.4)" stroke="rgba(255,111,0,0.5)" stroke-width="2"/>
        <text x="20" y="37" fill="rgba(255,255,255,0.7)" font-size="20" font-weight="900">B</text>
      </g>
      <!-- VS -->
      <circle cx="160" cy="80" r="22" fill="rgba(255,111,0,0.3)" stroke="rgba(255,193,7,0.6)" stroke-width="2"/>
      <text x="160" y="87" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="18" font-weight="900">VS</text>
    </svg>`,

    whosaidit: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Speech bubbles -->
      <g opacity=".6">
        <rect x="30" y="20" width="120" height="45" rx="15" fill="rgba(21,101,192,0.3)" stroke="rgba(66,165,245,0.4)" stroke-width="2"/>
        <polygon points="80,65 90,80 100,65" fill="rgba(21,101,192,0.3)"/>
        <text x="55" y="48" fill="rgba(255,255,255,0.5)" font-size="22">???</text>
      </g>
      <g opacity=".5">
        <rect x="170" y="50" width="120" height="45" rx="15" fill="rgba(66,165,245,0.25)" stroke="rgba(21,101,192,0.35)" stroke-width="2"/>
        <polygon points="220,95 230,110 240,95" fill="rgba(66,165,245,0.25)"/>
        <text x="195" y="78" fill="rgba(255,255,255,0.4)" font-size="22">???</text>
      </g>
      <!-- Silhouette figures -->
      <circle cx="90" cy="120" r="12" fill="rgba(66,165,245,0.2)"/>
      <rect x="80" y="132" width="20" height="20" rx="5" fill="rgba(66,165,245,0.15)"/>
      <circle cx="230" cy="130" r="12" fill="rgba(21,101,192,0.2)"/>
      <rect x="220" y="142" width="20" height="15" rx="5" fill="rgba(21,101,192,0.15)"/>
    </svg>`,

    speedround: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sr-glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Stopwatch -->
      <g transform="translate(120,15)">
        <circle cx="40" cy="55" r="42" fill="rgba(255,61,0,0.15)" stroke="rgba(230,81,0,0.5)" stroke-width="3"/>
        <circle cx="40" cy="55" r="35" fill="none" stroke="rgba(255,61,0,0.3)" stroke-width="2"/>
        <!-- Clock hand -->
        <line x1="40" y1="55" x2="40" y2="28" stroke="rgba(255,61,0,0.8)" stroke-width="3" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0 40 55;360 40 55" dur="2s" repeatCount="indefinite"/>
        </line>
        <!-- Button -->
        <rect x="35" y="5" width="10" height="10" rx="2" fill="rgba(230,81,0,0.4)"/>
      </g>
      <!-- Lightning bolts -->
      <path d="M60,40 L50,65 L58,63 L48,90" fill="none" stroke="rgba(255,193,7,0.5)" stroke-width="3" stroke-linecap="round" filter="url(#sr-glow)">
        <animate attributeName="opacity" values=".5;1;.5" dur="0.8s" repeatCount="indefinite"/>
      </path>
      <path d="M265,50 L255,75 L263,73 L253,100" fill="none" stroke="rgba(255,193,7,0.4)" stroke-width="2.5" stroke-linecap="round">
        <animate attributeName="opacity" values=".3;.8;.3" dur="1s" repeatCount="indefinite"/>
      </path>
      <!-- Speed lines -->
      <g stroke="rgba(255,61,0,0.2)" stroke-width="2" stroke-linecap="round">
        <line x1="20" y1="80" x2="70" y2="80"/><line x1="250" y1="60" x2="300" y2="60"/>
        <line x1="10" y1="120" x2="50" y2="120"/><line x1="260" y1="130" x2="310" y2="130"/>
      </g>
    </svg>`,

    backseatgamer: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bg-glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Game controller -->
      <g transform="translate(95,20)" filter="url(#bg-glow)">
        <rect x="0" y="30" width="130" height="70" rx="20" fill="rgba(0,229,255,0.15)" stroke="rgba(0,229,255,0.4)" stroke-width="2"/>
        <!-- D-pad -->
        <rect x="25" y="50" width="8" height="30" rx="2" fill="rgba(0,229,255,0.4)"/>
        <rect x="15" y="60" width="28" height="8" rx="2" fill="rgba(0,229,255,0.4)"/>
        <!-- Buttons -->
        <circle cx="95" cy="55" r="6" fill="rgba(255,68,68,0.4)"/>
        <circle cx="110" cy="65" r="6" fill="rgba(68,138,255,0.4)"/>
        <circle cx="80" cy="65" r="6" fill="rgba(255,215,0,0.4)"/>
        <circle cx="95" cy="75" r="6" fill="rgba(0,200,83,0.4)"/>
      </g>
      <!-- Speech bubbles -->
      <text x="40" y="50" font-size="20" opacity=".3" fill="#00E5FF">💬</text>
      <text x="260" y="60" font-size="16" opacity=".25" fill="#00E5FF">🚫<animate attributeName="opacity" values=".2;.4;.2" dur="2s" repeatCount="indefinite"/></text>
      <text x="50" y="140" font-size="14" opacity=".2" fill="#00E5FF">🤔</text>
      <text x="255" y="130" font-size="12" opacity=".3" fill="#00E5FF">❓</text>
    </svg>`,

    splittheroom: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Room split -->
      <rect x="10" y="10" width="145" height="140" rx="8" fill="rgba(69,39,160,0.2)" stroke="rgba(124,77,255,0.3)" stroke-width="2"/>
      <rect x="165" y="10" width="145" height="140" rx="8" fill="rgba(124,77,255,0.15)" stroke="rgba(69,39,160,0.3)" stroke-width="2"/>
      <!-- Crack down the middle -->
      <path d="M160,0 L155,20 L165,40 L158,60 L163,80 L155,100 L165,120 L158,140 L160,160" fill="none" stroke="rgba(124,77,255,0.5)" stroke-width="3" stroke-linecap="round">
        <animate attributeName="stroke-opacity" values=".3;.7;.3" dur="2s" repeatCount="indefinite"/>
      </path>
      <!-- People on each side -->
      <g opacity=".35">
        <circle cx="60" cy="60" r="10" fill="#7C4DFF"/><circle cx="90" cy="75" r="10" fill="#7C4DFF"/><circle cx="50" cy="90" r="10" fill="#7C4DFF"/>
        <circle cx="230" cy="55" r="10" fill="#4527A0"/><circle cx="260" cy="70" r="10" fill="#4527A0"/>
      </g>
      <!-- 50/50 -->
      <text x="80" y="135" text-anchor="middle" fill="rgba(124,77,255,0.5)" font-size="18" font-weight="900">60%</text>
      <text x="240" y="135" text-anchor="middle" fill="rgba(69,39,160,0.5)" font-size="18" font-weight="900">40%</text>
    </svg>`,

    courtroom: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cr-glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Gavel -->
      <g transform="translate(110,10)" filter="url(#cr-glow)">
        <rect x="35" y="70" width="30" height="8" rx="3" fill="rgba(212,175,55,0.4)"/>
        <rect x="20" y="50" width="60" height="25" rx="5" fill="rgba(139,69,19,0.35)" stroke="rgba(212,175,55,0.5)" stroke-width="2"/>
        <rect x="46" y="25" width="8" height="30" rx="2" fill="rgba(212,175,55,0.4)"/>
        <animateTransform attributeName="transform" type="rotate" values="0 160 60;-15 160 60;0 160 60" dur="2s" repeatCount="indefinite" additive="sum"/>
      </g>
      <!-- Prosecution vs Defense -->
      <text x="50" y="50" font-size="28" opacity=".35" fill="#ff4444">🔴</text>
      <text x="250" y="50" font-size="28" opacity=".35" fill="#448AFF">🔵</text>
      <!-- VS -->
      <text x="160" y="145" text-anchor="middle" fill="rgba(212,175,55,0.3)" font-size="22" font-weight="900">⚖️</text>
      <text x="55" y="140" font-size="12" opacity=".2" fill="#D4AF37">مذنب</text>
      <text x="240" y="140" font-size="12" opacity=".2" fill="#D4AF37">بريء</text>
    </svg>`,

    debateme: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Scales of justice -->
      <g transform="translate(110,15)" opacity=".7">
        <!-- Center beam -->
        <rect x="47" y="0" width="6" height="100" rx="2" fill="rgba(120,144,156,0.4)"/>
        <!-- Horizontal beam -->
        <rect x="0" y="20" width="100" height="6" rx="2" fill="rgba(120,144,156,0.5)">
          <animateTransform attributeName="transform" type="rotate" values="-3 50 23;3 50 23;-3 50 23" dur="4s" repeatCount="indefinite"/>
        </rect>
        <!-- Left plate -->
        <path d="M5,30 L-10,70 Q10,80 30,70 L15,30" fill="rgba(55,71,79,0.3)" stroke="rgba(120,144,156,0.4)" stroke-width="1.5">
          <animateTransform attributeName="transform" type="rotate" values="-3 50 23;3 50 23;-3 50 23" dur="4s" repeatCount="indefinite"/>
        </path>
        <!-- Right plate -->
        <path d="M85,30 L70,70 Q90,80 110,70 L95,30" fill="rgba(55,71,79,0.3)" stroke="rgba(120,144,156,0.4)" stroke-width="1.5">
          <animateTransform attributeName="transform" type="rotate" values="-3 50 23;3 50 23;-3 50 23" dur="4s" repeatCount="indefinite"/>
        </path>
        <!-- Base -->
        <rect x="30" y="95" width="40" height="8" rx="3" fill="rgba(120,144,156,0.3)"/>
      </g>
      <!-- Argument bubbles -->
      <text x="40" y="60" fill="rgba(120,144,156,0.3)" font-size="24" font-weight="900">!</text>
      <text x="270" y="50" fill="rgba(120,144,156,0.25)" font-size="28" font-weight="900">!</text>
    </svg>`,

    punishmentwheel: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pw-glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Wheel -->
      <g transform="translate(110,5)" filter="url(#pw-glow)">
        <circle cx="50" cy="70" r="55" fill="none" stroke="rgba(255,68,68,0.3)" stroke-width="3">
          <animateTransform attributeName="transform" type="rotate" values="0 50 70;360 50 70" dur="8s" repeatCount="indefinite"/>
        </circle>
        <!-- Wheel segments -->
        <line x1="50" y1="15" x2="50" y2="125" stroke="rgba(255,68,68,0.2)" stroke-width="1">
          <animateTransform attributeName="transform" type="rotate" values="0 50 70;360 50 70" dur="8s" repeatCount="indefinite"/>
        </line>
        <line x1="-5" y1="70" x2="105" y2="70" stroke="rgba(255,68,68,0.2)" stroke-width="1">
          <animateTransform attributeName="transform" type="rotate" values="0 50 70;360 50 70" dur="8s" repeatCount="indefinite"/>
        </line>
        <line x1="10" y1="30" x2="90" y2="110" stroke="rgba(255,68,68,0.2)" stroke-width="1">
          <animateTransform attributeName="transform" type="rotate" values="0 50 70;360 50 70" dur="8s" repeatCount="indefinite"/>
        </line>
        <line x1="90" y1="30" x2="10" y2="110" stroke="rgba(255,68,68,0.2)" stroke-width="1">
          <animateTransform attributeName="transform" type="rotate" values="0 50 70;360 50 70" dur="8s" repeatCount="indefinite"/>
        </line>
        <!-- Center -->
        <circle cx="50" cy="70" r="8" fill="rgba(255,68,68,0.4)"/>
        <!-- Pointer -->
        <polygon points="50,10 45,25 55,25" fill="rgba(255,215,0,0.6)"/>
      </g>
      <!-- Danger icons -->
      <text x="40" y="50" font-size="18" opacity=".3" fill="#FF4444">⚡</text>
      <text x="260" y="60" font-size="16" opacity=".25" fill="#FF4444">💀</text>
      <text x="50" y="140" font-size="14" opacity=".2" fill="#FFD700">🎲</text>
    </svg>`
  };

  /* ─── Abu Abed Mascot SVG ─── */
  const mascotSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="face-g" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#FFDBB4"/><stop offset="100%" stop-color="#E8B88A"/>
      </radialGradient>
      <filter id="mascot-shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/></filter>
    </defs>
    <g filter="url(#mascot-shadow)">
      <!-- Ghutra (headscarf) base -->
      <ellipse cx="100" cy="70" rx="68" ry="55" fill="#FFFFFF" stroke="#E8E8E8" stroke-width="1"/>
      <!-- Agal (black cord) -->
      <ellipse cx="100" cy="52" rx="58" ry="8" fill="#1A1A1A"/>
      <ellipse cx="100" cy="48" rx="55" ry="7" fill="#333"/>
      <!-- Face -->
      <ellipse cx="100" cy="95" rx="42" ry="48" fill="url(#face-g)"/>
      <!-- Eyes -->
      <ellipse cx="82" cy="88" rx="8" ry="9" fill="#FFFFFF"/>
      <ellipse cx="118" cy="88" rx="8" ry="9" fill="#FFFFFF"/>
      <circle cx="84" cy="88" r="5" fill="#2C1810"/>
      <circle cx="120" cy="88" r="5" fill="#2C1810"/>
      <circle cx="85" cy="86" r="2" fill="#FFFFFF"/>
      <circle cx="121" cy="86" r="2" fill="#FFFFFF"/>
      <!-- Eyebrows -->
      <path d="M72,78 Q82,72 92,78" fill="none" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M108,78 Q118,72 128,78" fill="none" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Nose -->
      <path d="M97,95 Q100,102 103,95" fill="none" stroke="#C69C6D" stroke-width="2" stroke-linecap="round"/>
      <!-- Mustache -->
      <path d="M80,108 Q90,102 100,108 Q110,102 120,108" fill="#2C1810" opacity=".8"/>
      <!-- Beard -->
      <path d="M72,112 Q75,140 100,148 Q125,140 128,112" fill="#2C1810" opacity=".6"/>
      <!-- Smile -->
      <path d="M85,115 Q100,125 115,115" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <!-- Ghutra drape sides -->
      <path d="M38,75 Q35,120 50,155" fill="#FFFFFF" stroke="#E8E8E8" stroke-width="1" opacity=".9"/>
      <path d="M162,75 Q165,120 150,155" fill="#FFFFFF" stroke="#E8E8E8" stroke-width="1" opacity=".9"/>
      <!-- Thobe collar hint -->
      <path d="M70,148 Q100,165 130,148" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/>
    </g>
  </svg>`;

  /* ─── Victory Trophy SVG ─── */
  const trophySVG = `<svg viewBox="0 0 160 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trophy-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFD700"/><stop offset="50%" stop-color="#FFA000"/><stop offset="100%" stop-color="#FFD700"/>
      </linearGradient>
      <filter id="trophy-glow"><feGaussianBlur stdDeviation="5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g filter="url(#trophy-glow)">
      <!-- Cup -->
      <path d="M40,25 L40,80 Q80,120 120,80 L120,25 Z" fill="url(#trophy-g)" stroke="#B8860B" stroke-width="2"/>
      <!-- Left handle -->
      <path d="M40,35 Q10,35 10,60 Q10,85 40,80" fill="none" stroke="url(#trophy-g)" stroke-width="6" stroke-linecap="round"/>
      <!-- Right handle -->
      <path d="M120,35 Q150,35 150,60 Q150,85 120,80" fill="none" stroke="url(#trophy-g)" stroke-width="6" stroke-linecap="round"/>
      <!-- Star -->
      <polygon points="80,40 87,56 105,56 91,66 96,82 80,72 64,82 69,66 55,56 73,56" fill="#FFFFFF" opacity=".5"/>
      <!-- Stem -->
      <rect x="70" y="95" width="20" height="30" rx="3" fill="url(#trophy-g)"/>
      <!-- Base -->
      <rect x="45" y="125" width="70" height="15" rx="5" fill="url(#trophy-g)" stroke="#B8860B" stroke-width="1.5"/>
      <rect x="55" y="140" width="50" height="10" rx="4" fill="#B8860B" opacity=".5"/>
      <!-- Shine -->
      <path d="M55,30 L55,70 Q60,30 65,30 Z" fill="rgba(255,255,255,0.4)"/>
    </g>
  </svg>`;

  /* ─── Inject illustrations into game card banners ─── */
  function injectGameCardIllustrations() {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
      const game = card.dataset.game;
      const banner = card.querySelector('.game-card__banner');
      if (!banner || !scenes[game]) return;

      // Create illustration layer behind the icon
      const illustrationDiv = document.createElement('div');
      illustrationDiv.className = 'game-card__illustration';
      illustrationDiv.innerHTML = scenes[game];
      banner.insertBefore(illustrationDiv, banner.firstChild);
    });
  }

  /* ─── Replace emoji mascots with SVG ─── */
  function upgradeMascots() {
    document.querySelectorAll('.mascot').forEach(el => {
      if (el.querySelector('svg')) return;
      el.innerHTML = mascotSVG;
      el.classList.add('mascot--svg');
    });
  }

  /* ─── Inject trophy SVG on victory screen ─── */
  function injectTrophy(container) {
    if (!container) return;
    const existing = container.querySelector('.trophy-svg');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'trophy-svg';
    div.innerHTML = trophySVG;
    container.prepend(div);
  }

  /* ─── Add decorative particles to lobby ─── */
  function addLobbyDecorations() {
    const lobby = document.getElementById('lobbyScreen');
    if (!lobby || lobby.querySelector('.lobby-deco')) return;

    const deco = document.createElement('div');
    deco.className = 'lobby-deco';
    deco.innerHTML = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" class="lobby-deco__svg">
      <!-- Floating geometric shapes -->
      <circle cx="80" cy="100" r="30" fill="rgba(0,200,83,0.06)"><animate attributeName="cy" values="100;70;100" dur="6s" repeatCount="indefinite"/></circle>
      <circle cx="720" cy="150" r="20" fill="rgba(212,175,55,0.05)"><animate attributeName="cy" values="150;120;150" dur="5s" repeatCount="indefinite"/></circle>
      <rect x="650" y="400" width="40" height="40" rx="8" fill="rgba(0,200,83,0.04)" transform="rotate(20,670,420)"><animate attributeName="transform" values="rotate(20,670,420);rotate(40,670,420);rotate(20,670,420)" dur="8s" repeatCount="indefinite"/></rect>
      <polygon points="100,450 120,420 140,450" fill="rgba(212,175,55,0.05)"><animate attributeName="opacity" values=".03;.08;.03" dur="4s" repeatCount="indefinite"/></polygon>
      <circle cx="400" cy="500" r="50" fill="rgba(0,200,83,0.03)"/>
      <!-- Dotted arcs -->
      <path d="M0,300 Q200,200 400,300" fill="none" stroke="rgba(0,200,83,0.05)" stroke-width="2" stroke-dasharray="6 8"/>
      <path d="M400,100 Q600,0 800,100" fill="none" stroke="rgba(212,175,55,0.04)" stroke-width="2" stroke-dasharray="4 6"/>
    </svg>`;
    lobby.style.position = 'relative';
    lobby.insertBefore(deco, lobby.firstChild);
  }

  /* ─── Boot screen enhancement ─── */
  function enhanceBootScreen() {
    const boot = document.getElementById('bootScreen');
    if (!boot || boot.querySelector('.boot-particles')) return;

    const particles = document.createElement('div');
    particles.className = 'boot-particles';
    particles.innerHTML = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" class="boot-particles__svg">
      ${Array.from({length: 20}, (_, i) => {
        const x = Math.random() * 400;
        const y = Math.random() * 400;
        const r = 1 + Math.random() * 3;
        const dur = 3 + Math.random() * 4;
        const delay = Math.random() * 3;
        const color = Math.random() > 0.5 ? '0,200,83' : '212,175,55';
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(${color},${0.1 + Math.random() * 0.2})"><animate attributeName="cy" values="${y};${y - 30};${y}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".1;.3;.1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
      }).join('')}
    </svg>`;
    boot.insertBefore(particles, boot.firstChild);
  }

  /* ─── Initialize everything ─── */
  function init() {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _setup);
    } else {
      _setup();
    }
  }

  function _setup() {
    injectGameCardIllustrations();
    upgradeMascots();
    enhanceBootScreen();
    addLobbyDecorations();
  }

  return { init, injectTrophy, trophySVG, mascotSVG, scenes };
})();

// Auto-initialize
GameIllustrations.init();
