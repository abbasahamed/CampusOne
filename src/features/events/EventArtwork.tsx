import type { CSSProperties } from 'react';
import type { CampusEvent } from '../../data/types';
import './eventArtwork.css';

interface EventArtworkProps {
  event: CampusEvent;
  variant: 'poster' | 'thumb';
}

const CATEGORY_MOTIF: Record<
  CampusEvent['category'],
  { code: string; bgLight: string; bgDark: string; accent: string; ink: string }
> = {
  Technical: {
    code: 'SYS / 01',
    bgLight: '#1736B8',
    bgDark: '#162970',
    accent: '#90AAFF',
    ink: '#F8FAFF',
  },
  Career: {
    code: 'CAR / 02',
    bgLight: '#1D2944',
    bgDark: '#1E2842',
    accent: '#7FA1FF',
    ink: '#F4F5FA',
  },
  Academic: {
    code: 'COL / 03',
    bgLight: '#1B5E42',
    bgDark: '#153F31',
    accent: '#72D6A1',
    ink: '#F4FAF7',
  },
  Cultural: {
    code: 'ART / 04',
    bgLight: '#6F3A14',
    bgDark: '#472814',
    accent: '#F1BE70',
    ink: '#FDF8F2',
  },
};

function GeometricPattern({
  category,
  accent,
}: {
  category: CampusEvent['category'];
  accent: string;
}) {
  if (category === 'Technical') {
    return (
      <svg viewBox="0 0 160 120" className="event-art-svg" aria-hidden="true">
        <g stroke={accent} strokeOpacity="0.28" strokeWidth="1" fill="none">
          <line x1="20" y1="0" x2="20" y2="120" />
          <line x1="60" y1="0" x2="60" y2="120" />
          <line x1="100" y1="0" x2="100" y2="120" />
          <line x1="0" y1="32" x2="160" y2="32" />
          <line x1="0" y1="76" x2="160" y2="76" />
        </g>
        <circle cx="116" cy="54" r="34" fill="none" stroke={accent} strokeWidth="2.5" />
        <circle cx="116" cy="54" r="14" fill={accent} fillOpacity="0.24" />
        <rect x="20" y="32" width="40" height="44" rx="4" fill={accent} fillOpacity="0.16" />
      </svg>
    );
  }
  if (category === 'Career') {
    return (
      <svg viewBox="0 0 160 120" className="event-art-svg" aria-hidden="true">
        <rect x="20" y="74" width="24" height="28" rx="3" fill={accent} fillOpacity="0.32" />
        <rect x="54" y="54" width="24" height="48" rx="3" fill={accent} fillOpacity="0.54" />
        <rect x="88" y="34" width="24" height="68" rx="3" fill={accent} fillOpacity="0.78" />
        <rect x="122" y="18" width="24" height="84" rx="3" fill={accent} />
      </svg>
    );
  }
  if (category === 'Academic') {
    return (
      <svg viewBox="0 0 160 120" className="event-art-svg" aria-hidden="true">
        <circle cx="104" cy="60" r="46" fill="none" stroke={accent} strokeOpacity="0.28" strokeWidth="1.5" />
        <circle cx="104" cy="60" r="31" fill="none" stroke={accent} strokeOpacity="0.52" strokeWidth="2" />
        <circle cx="104" cy="60" r="15" fill={accent} fillOpacity="0.3" />
        <line x1="18" y1="26" x2="68" y2="26" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="40" x2="54" y2="40" stroke={accent} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 120" className="event-art-svg" aria-hidden="true">
      <path
        d="M12 88 Q 48 22, 84 62 T 152 38"
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 102 Q 52 44, 92 78 T 152 58"
        fill="none"
        stroke={accent}
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="120" cy="30" r="12" fill={accent} fillOpacity="0.28" />
    </svg>
  );
}

export function EventArtwork({ event, variant }: EventArtworkProps) {
  const motif = CATEGORY_MOTIF[event.category];

  if (variant === 'thumb') {
    return (
      <span
        className="event-thumb-art"
        aria-hidden="true"
        style={
          {
            '--art-bg-light': motif.bgLight,
            '--art-bg-dark': motif.bgDark,
            '--art-ink': motif.ink,
          } as CSSProperties
        }
      >
        <GeometricPattern category={event.category} accent={motif.accent} />
      </span>
    );
  }

  return (
    <div
      className="event-poster-art"
      aria-hidden="true"
      style={
        {
          '--art-bg-light': motif.bgLight,
          '--art-bg-dark': motif.bgDark,
          '--art-ink': motif.ink,
          '--art-accent': motif.accent,
        } as CSSProperties
      }
    >
      <div className="event-poster-meta">
        <span>{motif.code}</span>
        <span>{event.category}</span>
      </div>
      <div className="event-poster-geometry">
        <GeometricPattern category={event.category} accent={motif.accent} />
      </div>
      <p className="event-poster-title">{event.title}</p>
    </div>
  );
}
