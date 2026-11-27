import type { CSSProperties } from 'react';
import type { CampusEvent } from '../../data/types';
import './eventArtwork.css';

interface PrintDesign {
  ground: string;
  groundDark: string;
  ink: string;
  inkDark: string;
  print: string;
  printDark: string;
  code: string;
  motto: string;
}

const designs = {
  systems: {
    ground: '#17329E',
    groundDark: '#132678',
    ink: '#FFFFFF',
    inkDark: '#F4F5FA',
    print: '#9DB3FF',
    printDark: '#9DB3FF',
    code: 'SYS / 01',
    motto: 'Structure & Craft',
  },
  careers: {
    ground: '#153932',
    groundDark: '#122E28',
    ink: '#F2FBF6',
    inkDark: '#F2FBF6',
    print: '#87E0AA',
    printDark: '#87E0AA',
    code: 'CAR / 02',
    motto: 'Next Trajectory',
  },
  research: {
    ground: '#EDE6D6',
    groundDark: '#26231D',
    ink: '#1E1B16',
    inkDark: '#F5EFE2',
    print: '#244CE5',
    printDark: '#829BFF',
    code: 'COL / 03',
    motto: 'Consensus & Logs',
  },
  music: {
    ground: '#4E1D16',
    groundDark: '#421812',
    ink: '#FFF6ED',
    inkDark: '#FFF6ED',
    print: '#F6AE84',
    printDark: '#F6AE84',
    code: 'MUS / 04',
    motto: 'Open Courtyard',
  },
  photo: {
    ground: '#111536',
    groundDark: '#0F1330',
    ink: '#F8F4E8',
    inkDark: '#F8F4E8',
    print: '#829BFF',
    printDark: '#9DB3FF',
    code: 'PHO / 05',
    motto: 'After Sunset',
  },
  zine: {
    ground: '#E3E8DC',
    groundDark: '#1F2620',
    ink: '#152218',
    inkDark: '#EBF2E4',
    print: '#244CE5',
    printDark: '#829BFF',
    code: 'ZIN / 06',
    motto: 'Type & Fold',
  },
} satisfies Record<string, PrintDesign>;

type Print = keyof typeof designs;

const printsByEvent: Record<string, Print> = {
  'evt-design-systems-26': 'systems',
  'evt-placement-prep-26': 'careers',
  'evt-colloquium-26': 'research',
  'evt-acoustic-eve-26': 'music',
  'evt-night-photo-26': 'photo',
  'evt-print-lab-26': 'zine',
};

function Illustration({ design }: { design: Print }) {
  const illustrations: Record<Print, React.ReactNode> = {
    systems: (
      <g fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="16" y1="26" x2="144" y2="26" strokeOpacity="0.35" />
        <line x1="16" y1="72" x2="144" y2="72" strokeOpacity="0.35" />
        <line x1="56" y1="12" x2="56" y2="132" strokeOpacity="0.35" />
        <line x1="108" y1="12" x2="108" y2="132" strokeOpacity="0.35" />
        <rect x="20" y="34" width="36" height="38" rx="4" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <circle cx="108" cy="72" r="34" strokeWidth="3" />
        <circle cx="108" cy="72" r="13" fill="currentColor" stroke="none" />
      </g>
    ),
    careers: (
      <g fill="currentColor">
        <rect x="14" y="96" width="28" height="30" rx="3" opacity="0.35" />
        <rect x="48" y="74" width="28" height="52" rx="3" opacity="0.55" />
        <rect x="82" y="50" width="28" height="76" rx="3" opacity="0.78" />
        <rect x="116" y="24" width="28" height="102" rx="3" />
        <path
          d="M22 68 L98 20 M80 20 H98 V38"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    ),
    research: (
      <g stroke="currentColor" strokeWidth="2.5">
        <line x1="28" y1="34" x2="82" y2="70" strokeOpacity="0.55" />
        <line x1="132" y1="34" x2="82" y2="70" strokeOpacity="0.55" />
        <line x1="82" y1="70" x2="82" y2="118" strokeOpacity="0.55" />
        <line x1="28" y1="34" x2="32" y2="112" strokeOpacity="0.35" />
        <line x1="132" y1="34" x2="128" y2="112" strokeOpacity="0.35" />
        <circle cx="28" cy="34" r="9" fill="none" />
        <circle cx="132" cy="34" r="9" fill="none" />
        <circle cx="82" cy="70" r="16" fill="currentColor" />
        <circle cx="32" cy="112" r="7" fill="currentColor" opacity="0.6" />
        <circle cx="82" cy="118" r="7" fill="currentColor" opacity="0.6" />
        <circle cx="128" cy="112" r="7" fill="currentColor" opacity="0.6" />
      </g>
    ),
    music: (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M12 72 H30 L38 44 L50 104 L64 26 L78 118 L94 34 L106 88 L116 64 H148"
          strokeWidth="3.5"
        />
        <path d="M22 118 C46 134, 114 134, 138 116" strokeWidth="2" strokeOpacity="0.55" />
        <path d="M26 24 C52 10, 108 10, 134 24" strokeWidth="2" strokeOpacity="0.45" />
      </g>
    ),
    photo: (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M16 44 V18 H42 M118 18 H144 V44 M144 100 V126 H118 M42 126 H16 V100" />
        <circle cx="80" cy="72" r="34" strokeOpacity="0.4" strokeWidth="2" />
        <path
          d="M92 40 A32 32 0 1 0 116 90 C90 96, 72 68, 92 40 Z"
          fill="currentColor"
          stroke="none"
        />
        <circle cx="118" cy="44" r="3" fill="currentColor" stroke="none" />
      </g>
    ),
    zine: (
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <polygon points="22,36 80,18 80,126 22,108" fill="none" />
        <polygon points="80,18 138,36 138,108 80,126" fill="none" />
        <polygon points="34,54 68,64 68,98 34,88" fill="currentColor" stroke="none" />
        <line x1="92" y1="54" x2="126" y2="44" />
        <line x1="92" y1="72" x2="126" y2="62" />
        <line x1="92" y1="90" x2="120" y2="82" strokeOpacity="0.6" />
        <path d="M12 18 H22 M17 13 V23 M138 126 H148 M143 121 V131" strokeWidth="1.75" />
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 160 144" className="event-art-svg">
      {illustrations[design]}
    </svg>
  );
}

export function EventArtwork({
  event,
  variant,
}: {
  event: CampusEvent;
  variant: 'poster' | 'thumb' | 'card';
}) {
  const print = printsByEvent[event.id] ?? 'systems';
  const design = designs[print];
  const style = {
    '--art-ground': design.ground,
    '--art-ground-dark': design.groundDark,
    '--art-ink': design.ink,
    '--art-ink-dark': design.inkDark,
    '--art-print': design.print,
    '--art-print-dark': design.printDark,
  } as CSSProperties;

  if (variant === 'thumb') {
    return (
      <span className={`event-thumb-art thumb--${print}`} style={style} aria-hidden="true">
        <Illustration design={print} />
      </span>
    );
  }

  return (
    <div
      className={`event-poster-art poster--${print} ${variant === 'card' ? 'poster--card' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <div className="poster-header-line">
        <span>{design.code}</span>
        <span>{event.category}</span>
      </div>
      <div className="poster-visual">
        <Illustration design={print} />
      </div>
      <div className="poster-footer-block">
        <span className="poster-motto">{design.motto}</span>
        <span className="poster-copy">{event.title}</span>
      </div>
    </div>
  );
}
