import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, CheckCircle2, ChevronRight, MapPin, Search } from 'lucide-react';
import { Button, IconButton } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader } from '../../components/Typography';
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

function getDateGroupKey(iso: string): string {
  return iso.slice(0, 10);
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
  const showEditorial = !query.trim() && category === 'All' && !savedOnly;
  const posterCollection = useMemo(
    () => (featured ? upcoming.filter((e) => e.id !== featured.id) : upcoming),
    [upcoming, featured],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return upcoming.filter((event) => {
      if (category !== 'All' && event.category !== category) return false;
      if (savedOnly && !bookmarkedIds.includes(event.id)) return false;
      if (q) {
        const haystack =
          `${event.title} ${event.venue} ${event.summary} ${event.organizer ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [upcoming, category, savedOnly, bookmarkedIds, query]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, CampusEvent[]>();
    for (const event of filtered) {
      if (showEditorial && featured && event.id === featured.id) continue;
      const key = getDateGroupKey(event.startIso);
      const bucket = groups.get(key);
      if (bucket) bucket.push(event);
      else groups.set(key, [event]);
    }
    return Array.from(groups.entries());
  }, [filtered, featured, showEditorial]);

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
      <PageHeader title="Campus Events" />

      {storageFailed && (
        <p className="events-note" role="status">
          Browser storage is unavailable; saved events and registrations apply to this session only.
        </p>
      )}

      <section className="events-controls" aria-label="Search and filter events">
        <div className="event-search-row">
          <div className="search-wrap">
            <Search size={17} className="search-icon" aria-hidden="true" />
            <label htmlFor="events-search-input" className="sr-only">
              Search events
            </label>
            <input
              id="events-search-input"
              type="search"
              placeholder="Search events"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="events-search"
            />
          </div>

          <button
            type="button"
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
            className="filter-chip saved-filter"
            data-selected={savedOnly}
          >
            <Bookmark size={16} aria-hidden="true" />
            <span>Saved{bookmarkedIds.length > 0 ? ` (${bookmarkedIds.length})` : ''}</span>
          </button>
        </div>

        <div className="category-pills" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
              className="filter-chip"
              data-selected={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {showEditorial && featured && (
        <section className="featured-event" aria-labelledby="featured-event-title">
          <EventArtwork event={featured} variant="poster" />
          <div className="featured-event-body">
            <div className="featured-meta-row">
              <StatusBadge label="Featured" tone="accent" />
              <span>{formatCampusDate(featured.startIso)}</span>
              <span className="tabular-nums">
                {formatEventTimeSpan(featured.startIso, featured.endIso)}
              </span>
            </div>
            <h2 id="featured-event-title">{featured.title}</h2>
            <p className="featured-summary">{featured.summary}</p>
            <p className="featured-venue">
              <MapPin size={15} aria-hidden="true" />
              <span>
                {featured.venue}
                {featured.organizer ? ` · ${featured.organizer}` : ''}
              </span>
            </p>
            <div className="featured-actions">
              <Button variant="primary" onClick={() => openEvent(featured.id)}>
                {registrations[featured.id] ? 'View registration' : 'View event'}
              </Button>
              <Button
                variant="secondary"
                aria-pressed={bookmarkedIds.includes(featured.id)}
                onClick={() => onToggleBookmark(featured.id)}
              >
                <Bookmark
                  size={16}
                  fill={bookmarkedIds.includes(featured.id) ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                {bookmarkedIds.includes(featured.id) ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {showEditorial && posterCollection.length > 0 && (
        <section className="poster-collection" aria-labelledby="poster-collection-title">
          <div className="poster-collection-head">
            <h2 id="poster-collection-title">Upcoming prints</h2>
            <span className="poster-collection-count tabular-nums">
              {posterCollection.length} events
            </span>
          </div>
          <div className="poster-rail" role="list" aria-label="Upcoming event posters">
            {posterCollection.map((event) => (
              <div key={event.id} className="poster-rail-item" role="listitem">
                <button
                  type="button"
                  className="poster-card-btn"
                  aria-haspopup="dialog"
                  aria-label={`${event.title}, ${formatShortDate(event.startIso)}, ${event.venue}`}
                  onClick={() => openEvent(event.id)}
                >
                  <EventArtwork event={event} variant="card" />
                  <span className="poster-card-meta">
                    <span className="tabular-nums">
                      {formatShortDate(event.startIso)} · {event.venue}
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <section className="events-empty" aria-live="polite">
          <h2>No matching events</h2>
          <p>
            {savedOnly && bookmarkedIds.length === 0
              ? 'You have not saved any events yet.'
              : 'No upcoming events match your search or selected category.'}
          </p>
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        </section>
      ) : (
        <div className="events-groups">
          {groupedByDate.map(([dateKey, items]) => (
            <section key={dateKey} className="event-date-group">
              <h2 className="event-date-heading">{formatCampusDate(dateKey)}</h2>
              <ul className="event-cards-list">
                {items.map((event) => {
                  const saved = bookmarkedIds.includes(event.id);
                  const reg = registrations[event.id];
                  return (
                    <li key={event.id} className="event-list-card">
                      <button
                        type="button"
                        className="event-row-main"
                        aria-haspopup="dialog"
                        onClick={() => openEvent(event.id)}
                      >
                        <EventArtwork event={event} variant="thumb" />
                        <span className="event-card-content">
                          <span className="event-card-meta">
                            {event.category} · {formatEventTimeSpan(event.startIso, event.endIso)}
                          </span>
                          <strong>{event.title}</strong>
                          <span className="event-card-venue">{event.venue}</span>
                          {event.organizer && (
                            <span className="event-card-meta">{event.organizer}</span>
                          )}
                          {reg && <StatusBadge label="Registered" tone="success" />}
                        </span>
                        <ChevronRight
                          size={16}
                          className="event-row-chevron"
                          aria-hidden="true"
                        />
                      </button>
                      <IconButton
                        label={
                          saved
                            ? `Remove ${event.title} from saved events`
                            : `Save ${event.title}`
                        }
                        aria-pressed={saved}
                        onClick={() => onToggleBookmark(event.id)}
                      >
                        <Bookmark
                          size={18}
                          fill={saved ? 'currentColor' : 'none'}
                          aria-hidden="true"
                        />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={activeEvent !== null}
        onClose={closeEvent}
        title={activeEvent?.title ?? 'Event details'}
        description={
          activeEvent
            ? `${activeEvent.category} · ${formatCampusDate(activeEvent.startIso)}`
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
            <EventArtwork event={activeEvent} variant="poster" />

            <dl className="event-detail-dl">
              <div>
                <dt>Date & time</dt>
                <dd className="tabular-nums">
                  {formatCampusDate(activeEvent.startIso)} ·{' '}
                  {formatEventTimeSpan(activeEvent.startIso, activeEvent.endIso)}
                </dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{activeEvent.venue}</dd>
              </div>
              {activeEvent.organizer && (
                <div>
                  <dt>Organizer</dt>
                  <dd>{activeEvent.organizer}</dd>
                </div>
              )}
            </dl>

            <p className="event-detail-desc">{activeEvent.description}</p>

            {activeRegistration ? (
              <div className="reg-confirmation" role="status">
                <CheckCircle2 size={18} aria-hidden="true" />
                <div>
                  <strong>Demo registration confirmed</strong>
                  <p className="tabular-nums">
                    Confirmation ID: {activeRegistration.confirmationId} (Demo only)
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
