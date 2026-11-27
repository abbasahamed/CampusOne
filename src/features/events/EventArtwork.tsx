import type { CSSProperties } from 'react';
import type { CampusEvent } from '../../data/types';
import './eventArtwork.css';

const designs = {
  systems: { ground: '#e5ddff', ink: '#312260', print: '#6442cb', copy: 'Form follows function.' },
  careers: { ground: '#153c35', ink: '#f0ffe9', print: '#9ce6a7', copy: 'Make your next move.' },
  research: { ground: '#f5dfad', ink: '#423015', print: '#92601c', copy: 'One idea, many nodes.' },
  music: { ground: '#6d251c', ink: '#fff7ee', print: '#ffac8a', copy: 'An evening unplugged.' },
  photo: { ground: '#25245a', ink: '#fcf2e0', print: '#edbbfd', copy: 'Find the light.' },
  zine: { ground: '#edf1bc', ink: '#213b23', print: '#47794a', copy: 'Make it in print.' },
} as const;

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
  const illustrations = {
    systems: (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M80 14 149 54 80 95 11 54zM11 54v33l69 42 69-42V54M80 95v34"/>
        <path d="M46 34 115 74v34M115 34 46 74v34M46 74l34 21 35-21" />
        <path d="m80 14 35 20-35 20-34-20z" fill="currentColor" stroke="none" />
      </g>
    ),
    careers: (
      <g fill="currentColor">
        <path d="M13 115h46V82h40V48h48v17h-30v34H77v33H13z"/>
        <path d="M89 15h58v20h-22L78 80 65 66l32-31h-8z"/>
        <path d="M21 17h28v27H21zM21 53h14v14H21z" opacity=".45"/>
      </g>
    ),
    research: (
      <g stroke="currentColor" strokeWidth="3">
        <path fill="none" d="m28 28 55 36 51-35m-51 35v48m-55-84 3 79 52 5 48-7 3-76"/>
        <g fill="currentColor"><circle cx="28" cy="28" r="10"/><circle cx="83" cy="64" r="16"/><circle cx="134" cy="29" r="10"/><circle cx="31" cy="107" r="8"/><circle cx="83" cy="112" r="8"/><circle cx="131" cy="105" r="8"/></g>
      </g>
    ),
    music: (
      <g fill="none" stroke="currentColor" strokeWidth="4">
        <path d="M9 65h19l8-26 12 61 14-81 14 108 18-94 13 59 11-27h33" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 115c22 21 95 24 119-5M17 22c36-17 91-19 118 4" opacity=".5"/>
      </g>
    ),
    photo: (
      <g fill="none" stroke="currentColor" strokeWidth="4">
        <path d="M12 47V20h29m79 0h27v27m0 48v26h-27m-79 0H12V95"/>
        <path d="M96 29a38 38 0 1 0 35 56c-28 8-52-22-35-56Z" fill="currentColor" stroke="none"/>
        <path d="M64 35v16m-8-8h16M115 29v20m-10-10h20"/>
      </g>
    ),
    zine: (
      <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path fill="none" d="M19 37 79 14l61 23v73l-61 20-60-20zm60-23v116M19 37l60 21 61-21"/>
        <path fill="currentColor" stroke="none" d="m32 58 34 12v35L32 93zm61 11 33-11v9L93 78zm0 17 33-11v8L93 95zm0 17 33-11v8l-33 11z"/>
      </g>
    ),
  };

  return <svg viewBox="0 0 160 144" className="event-art-svg">{illustrations[design]}</svg>;
}

export function EventArtwork({ event, variant }: { event: CampusEvent; variant: 'poster' | 'thumb' }) {
  const print = printsByEvent[event.id] ?? 'systems';
  const design = designs[print];
  const style = { '--art-ground': design.ground, '--art-ink': design.ink, '--art-print': design.print } as CSSProperties;
  if (variant === 'thumb') {
    return <span className="event-thumb-art" style={style} aria-hidden="true"><Illustration design={print} /></span>;
  }

  return (
    <div className={`event-poster-art poster--${print}`} style={style} aria-hidden="true">
      <span className="poster-copy">{design.copy}</span>
      <Illustration design={print} />
    </div>
  );
}
