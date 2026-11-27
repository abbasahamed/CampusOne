import { useCallback, useEffect, useState } from 'react';
import {
  DEMO_CLOCK_ISO,
  DEMO_EVENTS,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
} from '../data/demoData';
import type { FeePayment } from '../data/types';
import { readStorageValue, writeStorageValue } from './storage';

const PAYMENTS_STORAGE_KEY = 'campusone.payments.v1';
const EVENTS_STORAGE_KEY = 'campusone.events.v1';

export interface EventRegistrationRecord {
  eventId: string;
  registeredAtIso: string;
  confirmationId: string;
}

export interface PersistedEventsState {
  bookmarks: string[];
  registrations: Record<string, EventRegistrationRecord>;
}

const VALID_INVOICE_IDS = new Set(DEMO_INVOICES.map((inv) => inv.id));
const VALID_EVENT_IDS = new Set(DEMO_EVENTS.map((evt) => evt.id));

function parsePayments(raw: string | null): FeePayment[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const valid: FeePayment[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.invoiceId === 'string' &&
        VALID_INVOICE_IDS.has(item.invoiceId) &&
        !seen.has(item.invoiceId) &&
        typeof item.paidAtIso === 'string' &&
        typeof item.amountPaise === 'number' &&
        Number.isSafeInteger(item.amountPaise) &&
        item.amountPaise > 0 &&
        typeof item.methodLabel === 'string' &&
        typeof item.receiptNumber === 'string' &&
        item.simulated === true
      ) {
        seen.add(item.invoiceId);
        valid.push(item as FeePayment);
      }
    }
    return valid;
  } catch {
    return [];
  }
}

function parseEventsState(raw: string | null): PersistedEventsState {
  const empty: PersistedEventsState = { bookmarks: [], registrations: {} };
  if (!raw) return empty;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return empty;
    const candidate = parsed as Record<string, unknown>;
    const bookmarks = Array.isArray(candidate.bookmarks)
      ? Array.from(
          new Set(
            candidate.bookmarks.filter(
              (id): id is string => typeof id === 'string' && VALID_EVENT_IDS.has(id),
            ),
          ),
        )
      : [];
    const registrations: Record<string, EventRegistrationRecord> = {};
    if (candidate.registrations && typeof candidate.registrations === 'object') {
      for (const [key, val] of Object.entries(
        candidate.registrations as Record<string, unknown>,
      )) {
        if (
          VALID_EVENT_IDS.has(key) &&
          val &&
          typeof val === 'object' &&
          typeof (val as EventRegistrationRecord).registeredAtIso === 'string' &&
          typeof (val as EventRegistrationRecord).confirmationId === 'string'
        ) {
          registrations[key] = {
            eventId: key,
            registeredAtIso: (val as EventRegistrationRecord).registeredAtIso,
            confirmationId: (val as EventRegistrationRecord).confirmationId,
          };
        }
      }
    }
    return { bookmarks, registrations };
  } catch {
    return empty;
  }
}

export function buildDemoReceiptId(invoiceId: string): string {
  const suffix = invoiceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `RCPT-2026-1127-${suffix}`;
}

export function buildDemoConfirmationId(eventId: string): string {
  const suffix = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `REG-2026-${suffix}`;
}

export function getInitialDemoPayments(): FeePayment[] {
  const persisted = readStorageValue(PAYMENTS_STORAGE_KEY, parsePayments).value;
  const byInvoice = new Map<string, FeePayment>();
  for (const p of DEMO_PAYMENTS) byInvoice.set(p.invoiceId, p);
  for (const p of persisted) byInvoice.set(p.invoiceId, p);
  return Array.from(byInvoice.values());
}

export function getPersistedSimulatedPayments(): FeePayment[] {
  return readStorageValue(PAYMENTS_STORAGE_KEY, parsePayments).value;
}

export function useDemoAppState() {
  const [simulatedPayments, setSimulatedPayments] = useState<FeePayment[]>(
    () => readStorageValue(PAYMENTS_STORAGE_KEY, parsePayments).value,
  );
  const [eventsState, setEventsState] = useState<PersistedEventsState>(
    () => readStorageValue(EVENTS_STORAGE_KEY, parseEventsState).value,
  );
  const [storageFailed, setStorageFailed] = useState<boolean>(
    () =>
      !readStorageValue(PAYMENTS_STORAGE_KEY, parsePayments).persistedAvailable ||
      !readStorageValue(EVENTS_STORAGE_KEY, parseEventsState).persistedAvailable,
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PAYMENTS_STORAGE_KEY) {
        setSimulatedPayments(parsePayments(event.newValue));
      } else if (event.key === EVENTS_STORAGE_KEY) {
        setEventsState(parseEventsState(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const allPayments: readonly FeePayment[] = (() => {
    const byInvoice = new Map<string, FeePayment>();
    for (const p of DEMO_PAYMENTS) byInvoice.set(p.invoiceId, p);
    for (const p of simulatedPayments) byInvoice.set(p.invoiceId, p);
    return Array.from(byInvoice.values());
  })();

  const recordSimulatedPayment = useCallback(
    (invoiceId: string, amountPaise: number, methodLabel: string): FeePayment | null => {
      if (!VALID_INVOICE_IDS.has(invoiceId) || amountPaise <= 0) return null;
      const existingBase = DEMO_PAYMENTS.find((p) => p.invoiceId === invoiceId);
      if (existingBase) return existingBase;

      let committed: FeePayment | null = null;
      setSimulatedPayments((prev) => {
        const existing = prev.find((p) => p.invoiceId === invoiceId);
        if (existing) {
          committed = existing;
          return prev;
        }
        const created: FeePayment = {
          id: `pay-sim-${invoiceId}`,
          invoiceId,
          paidAtIso: DEMO_CLOCK_ISO,
          amountPaise,
          methodLabel,
          receiptNumber: buildDemoReceiptId(invoiceId),
          simulated: true,
        };
        committed = created;
        const next = [...prev, created];
        const ok = writeStorageValue(PAYMENTS_STORAGE_KEY, JSON.stringify(next));
        if (!ok) setStorageFailed(true);
        return next;
      });
      return committed;
    },
    [],
  );

  const toggleEventBookmark = useCallback((eventId: string) => {
    if (!VALID_EVENT_IDS.has(eventId)) return;
    setEventsState((prev) => {
      const exists = prev.bookmarks.includes(eventId);
      const bookmarks = exists
        ? prev.bookmarks.filter((id) => id !== eventId)
        : [...prev.bookmarks, eventId];
      const next: PersistedEventsState = { ...prev, bookmarks };
      const ok = writeStorageValue(EVENTS_STORAGE_KEY, JSON.stringify(next));
      if (!ok) setStorageFailed(true);
      return next;
    });
  }, []);

  const registerForEvent = useCallback((eventId: string): EventRegistrationRecord | null => {
    const event = DEMO_EVENTS.find((e) => e.id === eventId);
    if (!event || !event.registrationAvailable) return null;

    let result: EventRegistrationRecord | null = null;
    setEventsState((prev) => {
      const existing = prev.registrations[eventId];
      if (existing) {
        result = existing;
        return prev;
      }
      const created: EventRegistrationRecord = {
        eventId,
        registeredAtIso: DEMO_CLOCK_ISO,
        confirmationId: buildDemoConfirmationId(eventId),
      };
      result = created;
      const next: PersistedEventsState = {
        ...prev,
        registrations: { ...prev.registrations, [eventId]: created },
      };
      const ok = writeStorageValue(EVENTS_STORAGE_KEY, JSON.stringify(next));
      if (!ok) setStorageFailed(true);
      return next;
    });
    return result;
  }, []);

  return {
    payments: allPayments,
    bookmarkedEventIds: eventsState.bookmarks,
    eventRegistrations: eventsState.registrations,
    storageFailed,
    recordSimulatedPayment,
    toggleEventBookmark,
    registerForEvent,
  };
}
