import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, CheckCircle2, MapPin, Search } from 'lucide-react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader } from '../../components/Typography';
import { DEMO_EVENTS, DEMO_TIMEZONE } from '../../data/demoData';
import type { CampusEvent, EventCategory } from '../../data/types';
import { formatCampusDate } from '../../domain/format';
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
      const key = getDateGroupKey(event.startIso);
      const bucket = groups.get(key);
      if (bucket) bucket.push(event);
      else groups.set(key, [event]);
    }
    return Array.from(groups.entries());
  }, [filtered]);

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
      <PageHeader
        eyebrow="Campus life"
        title="Campus Events"
        subtitle="Workshops, research colloquiums, career clinics and cultural evenings."
      />

      {storageFailed && (
        <p className="events-note" role="status">
          Browser storage is unavailable; saved events and registrations apply to this session only.
        </p>
      )}

      {featured && (
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
                {registrations[featured.id] ? 'View registration' : 'Inspect event'}
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

      <section className="events-controls" aria-label="Search and filter events">
        <div className="search-wrap">
          <Search size={17} className="search-icon" aria-hidden="true" />
          <label htmlFor="events-search-input" className="sr-only">
            Search events
          </label>
          <input
            id="events-search-input"
            type="search"
            placeholder="Search by title, venue or organizer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="events-search"
          />
        </div>

        <div className="filter-row">
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

          <button
            type="button"
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
            className="filter-chip"
            data-selected={savedOnly}
          >
            Saved ({bookmarkedIds.length})
          </button>
        </div>
      </section>

      {groupedByDate.length === 0 ? (
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
                      <EventArtwork event={event} variant="thumb" />
                      <div className="event-card-content">
                        <div className="event-card-meta">
                          <span>{event.category}</span>
                          <span className="tabular-nums">
                            {formatEventTimeSpan(event.startIso, event.endIso)}
                          </span>
                          {reg && <StatusBadge label="Registered" tone="success" />}
                        </div>
                        <h3>{event.title}</h3>
                        <p className="event-card-summary">{event.summary}</p>
                        <p className="event-card-venue">{event.venue}</p>
                      </div>
                      <div className="event-card-actions">
                        <Button
                          variant="ghost"
                          aria-pressed={saved}
                          onClick={() => onToggleBookmark(event.id)}
                        >
                          <Bookmark
                            size={16}
                            fill={saved ? 'currentColor' : 'none'}
                            aria-hidden="true"
                          />
                          {saved ? 'Saved' : 'Save'}
                        </Button>
                        <Button variant="secondary" onClick={() => openEvent(event.id)}>
                          Details
                        </Button>
                      </div>
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
                    Register (Demo)
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
                  <strong>Simulated registration confirmed</strong>
                  <p className="tabular-nums">
                    Confirmation ID: {activeRegistration.confirmationId} (Demo only)
                  </p>
                </div>
              </div>
            ) : !activeEvent.registrationAvailable ? (
              <p className="event-walkin-note">
                Open walk-in session — no prior registration required.
              </p>
            ) : null}
          </div>
        )}
      </Dialog>
    </div>
  );
}
