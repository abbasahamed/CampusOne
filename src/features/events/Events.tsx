import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, CalendarDays, Check, MapPin, Search, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { PageHeader, SectionHeader } from '../../components/Typography';
import { DEMO_EVENTS, DEMO_TIMEZONE } from '../../data/demoData';
import type { CampusEvent, EventCategory } from '../../data/types';
import { formatCampusDate, formatShortDate } from '../../domain/format';
import { getFeaturedEvent, getUpcomingEvents } from '../../domain/selectors';
import type { EventRegistrationRecord } from '../../lib/demoState';
import { EventArtwork } from './EventArtwork';
import './events.css';

const CATEGORIES: readonly ('All' | EventCategory)[] = [
  'All',
  'Technical',
  'Career',
  'Academic',
  'Cultural',
];

function formatEventTimeSpan(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${fmt.format(new Date(startIso))}–${fmt.format(new Date(endIso))} IST`;
}

export function Events({
  bookmarkedIds,
  registrations,
  storageFailed,
  onToggleBookmark,
  onRegister,
}: {
  bookmarkedIds: readonly string[];
  registrations: Readonly<Record<string, EventRegistrationRecord>>;
  storageFailed: boolean;
  onToggleBookmark: (eventId: string) => void;
  onRegister: (eventId: string) => EventRegistrationRecord | null;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | EventCategory>('All');
  const [savedOnly, setSavedOnly] = useState(false);

  const selectedEventId = searchParams.get('event');
  const activeEvent =
    DEMO_EVENTS.find((e) => e.id === selectedEventId) ?? null;

  const upcoming = useMemo(() => getUpcomingEvents(), []);
  const featured = getFeaturedEvent();
  const filtering = query.trim() !== '' || category !== 'All' || savedOnly;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return upcoming.filter((event) => {
      if (category !== 'All' && event.category !== category) return false;
      if (savedOnly && !bookmarkedIds.includes(event.id)) return false;
      if (q) {
        const haystack =
          `${event.title} ${event.venue} ${event.summary} ${event.category} ${event.organizer ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [upcoming, category, savedOnly, bookmarkedIds, query]);

  const discoverList = filtering
    ? filtered
    : filtered.filter((e) => !featured || e.id !== featured.id);
  const savedEvents = upcoming.filter((e) => bookmarkedIds.includes(e.id));

  function openEvent(eventId: string) {
    setSearchParams({ event: eventId }, { replace: true });
  }

  function closeEvent() {
    setSearchParams({}, { replace: true });
  }

  function clearFilters() {
    setQuery('');
    setCategory('All');
    setSavedOnly(false);
  }

  const activeRegistration = activeEvent ? registrations[activeEvent.id] : undefined;
  const activeSaved = activeEvent ? bookmarkedIds.includes(activeEvent.id) : false;

  return (
    <div className="events-page">
      <PageHeader eyebrow="Campus calendar" title="Events" />

      {storageFailed && (
        <p className="events-note" role="status">
          Browser storage is unavailable; saved events and registrations apply to this session only.
        </p>
      )}

      <section className="events-controls" aria-label="Search and filter events">
        <div className="search-wrap">
          <Search size={17} className="search-icon" aria-hidden="true" />
          <label htmlFor="events-search-input" className="sr-only">
            Search events
          </label>
          <input
            id="events-search-input"
            type="search"
            placeholder="Search events, clubs, venues"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="events-search"
          />
        </div>

        <div className="category-pills-wrap">
          <div className="category-pills no-scrollbar" role="radiogroup" aria-label="Filter by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="radio"
                aria-checked={category === cat}
                onClick={() => setCategory(cat)}
                onFocus={(e) =>
                  e.currentTarget.scrollIntoView({
                    block: 'nearest',
                    inline: 'nearest',
                  })
                }
                className="event-chip"
                data-selected={category === cat}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
              onFocus={(e) =>
                e.currentTarget.scrollIntoView({
                  block: 'nearest',
                  inline: 'nearest',
                })
              }
              className="event-chip event-saved-chip"
              data-selected={savedOnly}
            >
              <Bookmark
                size={14}
                fill={savedOnly ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span>Saved{bookmarkedIds.length > 0 ? ` (${bookmarkedIds.length})` : ''}</span>
            </button>
          </div>
          <span className="category-pills-fade" aria-hidden="true" />
        </div>
      </section>

      {!filtering && featured && (
        <section className="featured-event" aria-labelledby="featured-event-title">
          <button
            type="button"
            onClick={() => openEvent(featured.id)}
            className="featured-poster-btn press"
            aria-haspopup="dialog"
          >
            <span className="sr-only">Open {featured.title}</span>
            <EventArtwork event={featured} variant="poster" />
          </button>
          <div className="featured-event-body">
            <p className="featured-kicker">
              Featured · {formatShortDate(featured.startIso)} ·{' '}
              <span className="num">{formatEventTimeSpan(featured.startIso, featured.endIso)}</span>
            </p>
            <h2 id="featured-event-title" className="featured-serif-title">
              {featured.title}
            </h2>
            <p className="featured-summary">{featured.description}</p>
            <p className="featured-venue">
              <MapPin size={15} aria-hidden="true" />
              <span>
                {featured.venue}
                {featured.organizer ? ` · ${featured.organizer}` : ''}
              </span>
            </p>
            <div className="featured-actions">
              <button
                type="button"
                onClick={() => openEvent(featured.id)}
                className="featured-cta press"
              >
                {registrations[featured.id] ? 'View pass' : 'See details'}
              </button>
              <BookmarkButton
                event={featured}
                saved={bookmarkedIds.includes(featured.id)}
                variant="plain"
                onToggle={() => onToggleBookmark(featured.id)}
              />
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="discover-heading" className="discover-section">
        <SectionHeader
          id="discover-heading"
          title={filtering ? 'Results' : 'Coming up'}
          action={
            filtering ? (
              <span className="num text-[0.8125rem] text-muted-foreground">
                {discoverList.length} found
              </span>
            ) : undefined
          }
        />

        {discoverList.length === 0 ? (
          <div className="events-empty" aria-live="polite">
            <p>
              {savedOnly && bookmarkedIds.length === 0
                ? 'No saved events yet. Bookmark a poster to keep it here.'
                : 'Nothing matches that yet. Try another category.'}
            </p>
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="poster-grid">
            {discoverList.map((event) => {
              const saved = bookmarkedIds.includes(event.id);
              const reg = registrations[event.id];
              return (
                <li key={event.id} className="poster-tile">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => openEvent(event.id)}
                    className="poster-tile-btn press"
                  >
                    <EventArtwork event={event} variant="card" />
                    <span className="poster-tile-meta">
                      {event.category} · {formatShortDate(event.startIso)}
                    </span>
                    <span className="poster-tile-title">{event.title}</span>
                    <span className="poster-tile-sub">
                      {reg ? (
                        <span className="font-medium text-positive">You’re registered</span>
                      ) : (
                        `${event.venue} · ${formatEventTimeSpan(event.startIso, event.endIso).replace(' IST', '')}`
                      )}
                    </span>
                  </button>
                  <BookmarkButton
                    event={event}
                    saved={saved}
                    variant="overlay"
                    className="poster-tile-bookmark"
                    onToggle={() => onToggleBookmark(event.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="saved-events-heading" className="saved-section">
        <SectionHeader
          id="saved-events-heading"
          title="Saved"
          action={
            <span className="num text-[0.8125rem] text-muted-foreground">
              {savedEvents.length}
            </span>
          }
        />
        {savedEvents.length === 0 ? (
          <p className="text-[0.875rem] text-muted-foreground">
            Tap the bookmark on any poster to keep it here.
          </p>
        ) : (
          <ul className="saved-events-list">
            {savedEvents.map((event) => (
              <li key={event.id} className="saved-event-row">
                <button
                  type="button"
                  onClick={() => openEvent(event.id)}
                  className="saved-event-trigger press"
                >
                  <EventArtwork event={event} variant="thumb" />
                  <span className="min-w-0">
                    <strong className="block truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground">
                      {event.title}
                    </strong>
                    <span className="block truncate text-[0.8125rem] text-muted-foreground">
                      {formatShortDate(event.startIso)} ·{' '}
                      {formatEventTimeSpan(event.startIso, event.endIso)} · {event.venue}
                    </span>
                  </span>
                </button>
                <BookmarkButton
                  event={event}
                  saved
                  variant="plain"
                  onToggle={() => onToggleBookmark(event.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={activeEvent !== null}
        onClose={closeEvent}
        title={activeEvent?.title ?? 'Event details'}
        description={
          activeEvent
            ? `${activeEvent.category}${activeEvent.organizer ? ` · ${activeEvent.organizer}` : ''}`
            : undefined
        }
        footer={
          activeEvent ? (
            <>
              <Button
                variant="secondary"
                aria-pressed={activeSaved}
                onClick={() => onToggleBookmark(activeEvent.id)}
              >
                <Bookmark
                  size={16}
                  fill={activeSaved ? 'currentColor' : 'none'}
                  className={activeSaved ? 'text-cobalt' : undefined}
                  aria-hidden="true"
                />
                {activeSaved ? 'Saved' : 'Save event'}
              </Button>
              {activeEvent.registrationAvailable ? (
                activeRegistration ? (
                  <Button variant="secondary" onClick={closeEvent}>
                    Done
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => onRegister(activeEvent.id)}
                  >
                    Register for demo
                  </Button>
                )
              ) : (
                <Button variant="primary" onClick={closeEvent}>
                  Close
                </Button>
              )}
            </>
          ) : null
        }
      >
        {activeEvent && (
          <div className="event-detail-body">
            <div className="event-sheet-hero">
              <div className="event-sheet-poster">
                <EventArtwork event={activeEvent} variant="poster" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.875rem] leading-snug text-muted-foreground">
                  {activeEvent.summary}
                </p>
              </div>
            </div>

            <dl className="event-detail-dl">
              <div>
                <dt>
                  <CalendarDays size={17} aria-hidden="true" />
                  <span>Date &amp; time</span>
                </dt>
                <dd className="num">
                  {formatCampusDate(activeEvent.startIso)} ·{' '}
                  {formatEventTimeSpan(activeEvent.startIso, activeEvent.endIso)}
                </dd>
              </div>
              <div>
                <dt>
                  <MapPin size={17} aria-hidden="true" />
                  <span>Venue</span>
                </dt>
                <dd>{activeEvent.venue}</dd>
              </div>
              {activeEvent.organizer && (
                <div>
                  <dt>
                    <Users size={17} aria-hidden="true" />
                    <span>Host</span>
                  </dt>
                  <dd>{activeEvent.organizer}</dd>
                </div>
              )}
            </dl>

            <p className="event-detail-desc">{activeEvent.description}</p>

            {activeRegistration ? (
              <div className="reg-confirmation" role="status">
                <span className="reg-check" aria-hidden="true">
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <div>
                  <strong>You’re in · Demo pass confirmed</strong>
                  <p className="num">
                    Pass {activeRegistration.confirmationId} (Demo only)
                  </p>
                </div>
              </div>
            ) : !activeEvent.registrationAvailable ? (
              <p className="event-walkin-note">Drop in. No registration needed.</p>
            ) : null}
          </div>
        )}
      </Dialog>
    </div>
  );
}

function BookmarkButton({
  event,
  saved,
  variant,
  className = '',
  onToggle,
}: {
  event: CampusEvent;
  saved: boolean;
  variant: 'overlay' | 'plain';
  className?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${event.title} from saved events` : `Save ${event.title}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`event-bookmark-btn press ${
        variant === 'overlay'
          ? 'glass text-foreground shadow-sm'
          : 'bg-surface text-foreground ring-1 ring-hairline hover:bg-surface-2'
      } ${className}`}
    >
      <Bookmark
        size={17}
        strokeWidth={2}
        className={saved ? 'fill-cobalt text-cobalt scale-110 transition-transform' : 'transition-transform'}
        aria-hidden="true"
      />
    </button>
  );
}
