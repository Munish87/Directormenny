/**
 * High-resolution procedural SVG artwork generator for DM OS.
 * Produces clean, text-free cinematic key art for background backdrops,
 * square media tiles, and AI Art gallery items.
 */

function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export function getDirectorAvatarUri(): string {
  return '/images/dm-logo.png';
}

export function getArtworkDataUri(
  preset: string,
  dominantColor = '#2563eb',
  secondaryColor = '#06b6d4',
  _title = ''
): string {
  let geometryMarkup = '';

  switch (preset) {
    case 'cyber-pursuit':
    case 'megacity':
      geometryMarkup = `
        <!-- Atmospheric Horizon Glow -->
        <ellipse cx="850" cy="470" rx="680" ry="190" fill="${dominantColor}" opacity="0.28"/>
        <ellipse cx="850" cy="480" rx="460" ry="70" fill="${secondaryColor}" opacity="0.35"/>
        <!-- Perspective Cyber Highway Grid -->
        <g stroke="${secondaryColor}" stroke-opacity="0.22" stroke-width="1.2">
          <line x1="850" y1="470" x2="-100" y2="900"/>
          <line x1="850" y1="470" x2="220" y2="900"/>
          <line x1="850" y1="470" x2="540" y2="900"/>
          <line x1="850" y1="470" x2="850" y2="900"/>
          <line x1="850" y1="470" x2="1160" y2="900"/>
          <line x1="850" y1="470" x2="1480" y2="900"/>
          <line x1="850" y1="470" x2="1700" y2="900"/>
          <line x1="0" y1="560" x2="1600" y2="560"/>
          <line x1="0" y1="670" x2="1600" y2="670"/>
          <line x1="0" y1="800" x2="1600" y2="800"/>
        </g>
        <!-- Distant Monolithic Towers -->
        <g fill="#060a14" stroke="${dominantColor}" stroke-opacity="0.35" stroke-width="1.2">
          <rect x="260" y="170" width="95" height="300"/>
          <rect x="380" y="110" width="130" height="360"/>
          <rect x="540" y="210" width="85" height="260"/>
          <rect x="1040" y="130" width="120" height="340"/>
          <rect x="1190" y="185" width="105" height="285"/>
          <rect x="1320" y="220" width="85" height="250"/>
        </g>
        <!-- Anamorphic Lens Streak & Night Silhouette -->
        <ellipse cx="850" cy="472" rx="640" ry="6" fill="${secondaryColor}" opacity="0.65"/>
        <ellipse cx="850" cy="472" rx="800" ry="2" fill="#ffffff" opacity="0.9"/>
        <polygon points="690,600 1010,600 1075,672 625,672" fill="#070b14" stroke="${secondaryColor}" stroke-width="2.2"/>
        <rect x="655" y="626" width="95" height="10" rx="5" fill="#f43f5e"/>
        <rect x="950" y="626" width="95" height="10" rx="5" fill="#f43f5e"/>
      `;
      break;

    case 'solar-eclipse':
    case 'eclipse':
      geometryMarkup = `
        <!-- Total Solar Eclipse Corona -->
        <circle cx="920" cy="360" r="260" fill="${dominantColor}" opacity="0.22"/>
        <circle cx="920" cy="360" r="175" fill="none" stroke="${dominantColor}" stroke-width="12" opacity="0.8"/>
        <circle cx="920" cy="360" r="166" fill="#04060b" stroke="#fde68a" stroke-width="2.5"/>
        <ellipse cx="920" cy="360" rx="680" ry="3.5" fill="#fef08a" opacity="0.75"/>
        <!-- Four Obsidian Mirror Monoliths -->
        <g fill="#060911" stroke="${dominantColor}" stroke-width="1.8" stroke-opacity="0.75">
          <polygon points="480,310 520,292 520,660 480,660"/>
          <polygon points="650,260 692,242 692,670 650,670"/>
          <polygon points="1148,242 1190,260 1190,670 1148,670"/>
          <polygon points="1310,292 1350,310 1350,660 1310,660"/>
        </g>
        <path d="M0 640 Q450 595 920 635 T1600 620 L1600 900 L0 900 Z" fill="#04060c" stroke="${secondaryColor}" stroke-width="1.5" stroke-opacity="0.35"/>
      `;
      break;

    case 'liquid-chrome':
    case 'valkyrie':
    case 'reactor':
      geometryMarkup = `
        <g stroke="${dominantColor}" stroke-opacity="0.28" stroke-width="1.5" fill="none">
          <circle cx="900" cy="420" r="320"/>
          <circle cx="900" cy="420" r="245" stroke-dasharray="12 10"/>
          <circle cx="900" cy="420" r="175"/>
        </g>
        <circle cx="900" cy="420" r="126" fill="url(#chromeGrad)" stroke="#ffffff" stroke-width="2"/>
        <circle cx="660" cy="340" r="44" fill="url(#chromeGrad)" stroke="${secondaryColor}" stroke-width="1.5"/>
        <circle cx="1130" cy="495" r="56" fill="url(#chromeGrad)" stroke="${dominantColor}" stroke-width="1.5"/>
        <ellipse cx="900" cy="420" rx="620" ry="2.5" fill="#ffffff" opacity="0.65"/>
      `;
      break;

    case 'cathedral':
    case 'orbital-arena':
    case 'seraphim':
      geometryMarkup = `
        <g opacity="0.42">
          <polygon points="900,50 280,860 430,860" fill="url(#beamGrad)"/>
          <polygon points="900,50 580,860 740,860" fill="url(#beamGrad)"/>
          <polygon points="900,50 1060,860 1220,860" fill="url(#beamGrad)"/>
          <polygon points="900,50 1360,860 1510,860" fill="url(#beamGrad)"/>
        </g>
        <g fill="#091022" stroke="${secondaryColor}" stroke-width="1.8" stroke-opacity="0.75">
          <rect x="540" y="190" width="52" height="460" rx="6"/>
          <rect x="710" y="150" width="60" height="500" rx="6"/>
          <rect x="1030" y="150" width="60" height="500" rx="6"/>
          <rect x="1208" y="190" width="52" height="460" rx="6"/>
        </g>
        <circle cx="900" cy="360" r="92" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.9"/>
        <ellipse cx="900" cy="670" rx="540" ry="34" fill="none" stroke="${dominantColor}" stroke-width="2" opacity="0.65"/>
      `;
      break;

    default:
      geometryMarkup = `
        <g fill="none" stroke="${dominantColor}" stroke-width="2" opacity="0.65">
          <polygon points="900,140 1220,640 580,640"/>
          <polygon points="900,210 1150,600 650,600" stroke="${secondaryColor}"/>
          <circle cx="900" cy="450" r="145" stroke="#ffffff" stroke-width="2"/>
        </g>
        <ellipse cx="900" cy="450" rx="640" ry="3" fill="${secondaryColor}" opacity="0.8"/>
      `;
      break;
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>
      <radialGradient id="sky" cx="58%" cy="38%" r="72%">
        <stop offset="0%" stop-color="${dominantColor}" stop-opacity="0.52"/>
        <stop offset="48%" stop-color="#0a1020" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#05070d"/>
      </radialGradient>
      <linearGradient id="beamGrad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="${secondaryColor}" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="${dominantColor}" stop-opacity="0.0"/>
      </linearGradient>
      <radialGradient id="chromeGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="${secondaryColor}"/>
        <stop offset="70%" stop-color="${dominantColor}"/>
        <stop offset="100%" stop-color="#05070d"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="#05070d"/>
    <rect width="1600" height="900" fill="url(#sky)"/>
    ${geometryMarkup}
  </svg>`;

  return svgToDataUri(svg);
}
