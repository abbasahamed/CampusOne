import type { ReactNode } from 'react';
import type { CampusEvent } from '../../data/types';
import './eventArtwork.css';

function PosterFrame({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={`poster-frame @container relative isolate aspect-[4/5] w-full overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function SystemsWorkshopPoster({ className = '' }: { className?: string }) {
  return (
    <PosterFrame className={`bg-[#142763] text-[#f5f3ed] ${className}`}>
      <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full" fill="none">
        {[50, 100, 150].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="250" stroke="#9eb5ff" strokeOpacity="0.2" strokeWidth="1" />
        ))}
        {[62, 125, 188].map((y) => (
          <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#9eb5ff" strokeOpacity="0.2" strokeWidth="1" />
        ))}
        <circle cx="136" cy="108" r="50" stroke="#f5f3ed" strokeOpacity="0.85" strokeWidth="2" />
        <circle cx="136" cy="108" r="18" fill="#e6503a" />
        <rect x="26" y="68" width="60" height="60" rx="6" fill="#9eb5ff" fillOpacity="0.2" stroke="#9eb5ff" strokeWidth="1.5" />
      </svg>
      <div className="absolute top-[7cqw] right-[7cqw] left-[7cqw] flex justify-between text-[3.8cqw] font-medium tracking-[0.1em] text-[#9eb5ff]">
        <span>DESIGN GUILD</span>
        <span>28 NOV</span>
      </div>
      <div className="absolute right-[7cqw] bottom-[7cqw] left-[7cqw]">
        <div className="font-serif text-[16.5cqw] leading-[0.88] tracking-[-0.03em]">
          Systems
          <br />
          <span className="italic text-[#9eb5ff]">&amp; Craft</span>
        </div>
        <div className="mt-[2.5cqw] text-[3.8cqw] font-medium tracking-[0.04em] text-[#f5f3ed]/75">
          BLOCK D · STUDIO · 3 PM
        </div>
      </div>
    </PosterFrame>
  );
}

function CareerClinicPoster({ className = '' }: { className?: string }) {
  const bars = [18, 30, 44, 60, 78];
  return (
    <PosterFrame className={`bg-[#12204a] text-white ${className}`}>
      <div className="absolute inset-x-[7cqw] bottom-0 flex h-[60%] items-end gap-[2.4cqw]">
        {bars.map((h, i) => (
          <div
            key={h}
            className="flex-1 rounded-t-[1.5cqw]"
            style={{
              height: `${h}%`,
              background:
                i === bars.length - 1
                  ? '#f4efe4'
                  : `oklch(${0.45 + i * 0.07} 0.16 263)`,
            }}
          />
        ))}
      </div>
      <div className="absolute top-[7cqw] right-[7cqw] left-[7cqw] flex justify-between text-[3.8cqw] font-medium tracking-[0.08em] text-white/75">
        <span>CAREER STUDIO</span>
        <span>30 NOV · 4:30 PM</span>
      </div>
      <div className="absolute top-[17cqw] left-[7cqw] text-[18cqw] leading-[0.88] font-semibold tracking-[-0.055em]">
        Offer
        <br />
        <span className="text-[#9fb5ff]">Clinic</span>
      </div>
      <div className="absolute top-[19cqw] right-[7cqw] text-right text-[3.2cqw] leading-snug text-white/80">
        Mock rounds
        <br />
        Portfolio
        <br />
        Alumni panel
      </div>
    </PosterFrame>
  );
}

function ColloquiumPoster({ className = '' }: { className?: string }) {
  return (
    <PosterFrame className={`bg-[#0b0e0c] font-mono text-[#c8f53a] ${className}`}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#c8f53a 0.8px, transparent 0.8px)',
          backgroundSize: '7cqw 7cqw',
        }}
      />
      <div className="absolute top-[7cqw] left-[7cqw] text-[4cqw] tracking-[0.1em] text-[#c8f53a]/85">
        {'// RESEARCH · LOGS'}
      </div>
      <div className="absolute inset-x-[6cqw] top-[24cqw] leading-[0.86] font-bold tracking-[-0.06em]">
        <div className="text-[22cqw]">DIST</div>
        <div className="flex items-end text-[22cqw]">
          <span className="text-[#f2f5ea]">/SYNC</span>
          <span className="ml-[1cqw] mb-[2.5cqw] inline-block h-[16cqw] w-[5.5cqw] bg-[#c8f53a] motion-safe:animate-[blink_1.1s_steps(1)_infinite]" />
        </div>
      </div>
      <div className="absolute inset-x-[7cqw] bottom-[7cqw] flex items-end justify-between text-[4cqw] text-[#f2f5ea]">
        <span>
          02.12 · 11 AM
          <br />
          <span className="text-[#c8f53a]">SEMINAR HALL 1</span>
        </span>
        <span className="text-right text-[#f2f5ea]/65">
          OPEN
          <br />
          LECTURE
        </span>
      </div>
    </PosterFrame>
  );
}

function AcousticPoster({ className = '' }: { className?: string }) {
  return (
    <PosterFrame className={`bg-[#0f3b2c] text-[#efe6cf] ${className}`}>
      <svg viewBox="0 0 200 250" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 40 + i * 11;
          const amp = 2 + Math.sin(i * 0.7) * 9 + (i > 4 && i < 10 ? 8 : 0);
          return (
            <path
              key={i}
              d={`M0 ${y} C 40 ${y - amp}, 60 ${y + amp}, 100 ${y} S 160 ${y - amp}, 200 ${y}`}
              fill="none"
              stroke="#efe6cf"
              strokeOpacity={0.18 + (i % 4) * 0.12}
              strokeWidth="1.2"
            />
          );
        })}
      </svg>
      <div className="absolute top-[7cqw] left-[7cqw] text-[3.8cqw] tracking-[0.14em] text-[#e9c46a]">
        MUSIC COLLECTIVE · LIVE
      </div>
      <div className="absolute right-[7cqw] bottom-[7cqw] left-[7cqw]">
        <div className="font-serif text-[21cqw] leading-[0.85] tracking-[-0.035em] italic">
          acoustic
        </div>
        <div className="mt-[3cqw] flex justify-between text-[4cqw] text-[#efe6cf]/85">
          <span>04 Dec · 6:00 PM</span>
          <span>Amphitheatre</span>
        </div>
      </div>
    </PosterFrame>
  );
}

function PhotoWalkPoster({ className = '' }: { className?: string }) {
  return (
    <PosterFrame className={`bg-[#a3144a] text-[#fff3df] ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="poster-mandala absolute top-1/2 left-1/2 w-[124%] -translate-x-1/2 -translate-y-[58%] motion-safe:animate-[spin-slow_120s_linear_infinite]"
      >
        <g fill="none" strokeWidth="1.6">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="62"
              y="62"
              width="76"
              height="76"
              rx="3"
              stroke="#f7a823"
              transform={`rotate(${i * 7.5} 100 100)`}
              opacity={0.85 - i * 0.04}
            />
          ))}
          {[22, 34, 46, 58, 90].map((r, i) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              stroke={i % 2 ? '#ffd27a' : '#ff6b3d'}
              strokeDasharray={i === 4 ? '2 5' : undefined}
            />
          ))}
        </g>
        {Array.from({ length: 16 }).map((_, i) => (
          <circle
            key={i}
            cx="100"
            cy="24"
            r="3.2"
            fill="#ffd27a"
            transform={`rotate(${i * 22.5} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="9" fill="#ff6b3d" />
      </svg>
      <div className="absolute top-[7cqw] right-[7cqw] left-[7cqw] flex justify-between text-[3.8cqw] font-medium tracking-[0.12em]">
        <span>05 DEC · 6 PM</span>
        <span>EAST QUAD</span>
      </div>
      <div className="absolute inset-x-[7cqw] bottom-[7cqw] flex items-end justify-between">
        <div className="font-serif text-[23cqw] leading-[0.82] tracking-[-0.04em]">
          Dusk<span className="text-[#f7a823]">Walk</span>
        </div>
      </div>
    </PosterFrame>
  );
}

function PrintLabPoster({ className = '' }: { className?: string }) {
  return (
    <PosterFrame className={`bg-[#f1eadc] text-[#1b1a17] ${className}`}>
      {[30, 52, 74].map((t) => (
        <div
          key={t}
          className="absolute inset-x-0 h-px bg-[#1b1a17]/25"
          style={{ top: `${t}%` }}
        />
      ))}
      <div className="absolute top-[14%] -right-[6cqw] font-serif text-[74cqw] leading-none tracking-[-0.06em] text-[#d6382a] italic">
        Aa
      </div>
      <div className="absolute top-[7cqw] left-[7cqw] text-[4cqw] leading-tight font-medium tracking-[0.02em]">
        Print Collective
        <br />
        <span className="text-[#1b1a17]/60">workshop</span>
      </div>
      <div className="absolute bottom-[7cqw] left-[7cqw]">
        <div className="font-serif text-[15cqw] leading-[0.9] tracking-[-0.03em]">
          Print Lab
        </div>
        <div className="mt-[2.5cqw] text-[4cqw] font-medium tracking-[0.04em] text-[#1b1a17]/70">
          07 DEC · 2 PM · BLOCK C
        </div>
      </div>
      <div className="absolute top-[30%] left-[7cqw] -translate-y-full pb-[1cqw] text-[3cqw] tracking-[0.1em] text-[#1b1a17]/50">
        ASCENDER
      </div>
      <div className="absolute top-[74%] left-[7cqw] -translate-y-full pb-[1cqw] text-[3cqw] tracking-[0.1em] text-[#1b1a17]/50">
        BASELINE
      </div>
    </PosterFrame>
  );
}

const POSTERS_BY_EVENT_ID: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  'evt-design-systems-26': SystemsWorkshopPoster,
  'evt-placement-prep-26': CareerClinicPoster,
  'evt-colloquium-26': ColloquiumPoster,
  'evt-acoustic-eve-26': AcousticPoster,
  'evt-night-photo-26': PhotoWalkPoster,
  'evt-print-lab-26': PrintLabPoster,
};

export function EventArtwork({
  event,
  variant,
  className = '',
}: {
  event: CampusEvent;
  variant: 'poster' | 'thumb' | 'card';
  className?: string;
}) {
  const Poster = POSTERS_BY_EVENT_ID[event.id] ?? SystemsWorkshopPoster;

  if (variant === 'thumb') {
    return (
      <span className={`event-poster-thumb ${className}`}>
        <Poster className="rounded-xl" />
      </span>
    );
  }

  return (
    <Poster
      className={`${variant === 'card' ? 'rounded-[1.25rem]' : 'rounded-[1.5rem]'} ${className}`}
    />
  );
}
