import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Info,
  Loader2,
  ReceiptText,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader, SectionHeader } from '../../components/Typography';
import { DEMO_INVOICES, DEMO_STUDENT, DEMO_TODAY_DATE } from '../../data/demoData';
import type { FeeInvoice, FeePayment } from '../../data/types';
import { formatCampusDate, formatPaise, formatShortDate } from '../../domain/format';
import { getInvoiceTotalPaise, getOutstandingInvoices } from '../../domain/selectors';
import './fees.css';

type PaymentDialogStage = 'invoice' | 'review' | 'processing' | 'success' | 'failure' | 'receipt';
type DemoOutcome = 'success' | 'failure';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', detail: 'demo@campusone', icon: Smartphone },
  { id: 'Net banking', label: 'Net banking', detail: 'Demo Bank of India', icon: Building2 },
  { id: 'Debit card', label: 'Debit card', detail: 'Demo card ···· 0000', icon: CreditCard },
] as const;

export function Fees({
  payments,
  storageFailed,
  onCommitPayment,
}: {
  payments: readonly FeePayment[];
  storageFailed: boolean;
  onCommitPayment: (
    invoiceId: string,
    amountPaise: number,
    methodLabel: string,
  ) => FeePayment | null;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const outstanding = getOutstandingInvoices(payments);
  const totalOutstandingPaise = outstanding.reduce(
    (sum, inv) => sum + getInvoiceTotalPaise(inv),
    0,
  );

  const requestedInvoiceId = searchParams.get('invoice');
  const focusedInvoice: FeeInvoice =
    DEMO_INVOICES.find((inv) => inv.id === requestedInvoiceId) ??
    outstanding[0] ??
    DEMO_INVOICES[0]!;

  const [dialogInvoiceId, setDialogInvoiceId] = useState<string | null>(null);
  const [stage, setStage] = useState<PaymentDialogStage>('review');
  const [selectedMethod, setSelectedMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [demoOutcome, setDemoOutcome] = useState<DemoOutcome>('success');
  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null);

  const dialogInvoice = DEMO_INVOICES.find((inv) => inv.id === dialogInvoiceId) ?? null;
  const receipt =
    activeReceipt ?? payments.find((payment) => payment.invoiceId === dialogInvoiceId);
  const focusedPayment = payments.find((p) => p.invoiceId === focusedInvoice.id);
  const focusedOverdue = !focusedPayment && focusedInvoice.dueDate < DEMO_TODAY_DATE;

  function handleSelectInvoiceRow(invoice: FeeInvoice) {
    setSearchParams({ invoice: invoice.id }, { replace: true });
    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(min-width: 960px)').matches;
    if (!isDesktop) {
      setDialogInvoiceId(invoice.id);
      setActiveReceipt(null);
      setStage('invoice');
    }
  }

  useEffect(() => {
    if (stage !== 'processing' || !dialogInvoice) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReduced ? 80 : 600;

    const timer = window.setTimeout(() => {
      if (demoOutcome === 'failure') {
        setStage('failure');
        return;
      }
      const total = getInvoiceTotalPaise(dialogInvoice);
      const committed = onCommitPayment(dialogInvoice.id, total, selectedMethod);
      setActiveReceipt(committed);
      setStage('success');
    }, delay);

    return () => window.clearTimeout(timer);
  }, [stage, dialogInvoice, demoOutcome, selectedMethod, onCommitPayment]);

  function openPaymentReview(invoice: FeeInvoice) {
    const existing = payments.find((p) => p.invoiceId === invoice.id);
    if (existing) {
      openReceipt(existing);
      return;
    }
    setDialogInvoiceId(invoice.id);
    setDemoOutcome('success');
    setActiveReceipt(null);
    setStage('review');
  }

  function openReceipt(payment: FeePayment) {
    setDialogInvoiceId(payment.invoiceId);
    setActiveReceipt(payment);
    setStage('receipt');
  }

  function closeDialog() {
    if (stage === 'processing') return;
    setDialogInvoiceId(null);
  }

  function confirmPayment() {
    if (!dialogInvoice || stage !== 'review') return;
    const alreadyPaid = payments.find((p) => p.invoiceId === dialogInvoice.id);
    if (alreadyPaid) {
      setActiveReceipt(alreadyPaid);
      setStage('receipt');
      return;
    }
    setStage('processing');
  }

  const nextDueInvoice = outstanding[0];
  const daysToNextDue = nextDueInvoice
    ? Math.round(
        (Date.parse(nextDueInvoice.dueDate) - Date.parse(DEMO_TODAY_DATE)) / 86_400_000,
      )
    : null;

  return (
    <div className="fees-page">
      <PageHeader eyebrow="Academic year 2026–27" title="Fees" />

      {storageFailed && (
        <p className="fees-storage-note" role="status">
          Browser storage is unavailable; simulated payment changes apply to this session only.
        </p>
      )}

      <div className="fees-master-detail">
        <div className="fees-master-col">
          {/* Signature v0 Financial Pass */}
          <section className="fee-pass" aria-labelledby="balance-heading">
            <div className="fee-pass-rings" aria-hidden="true" />
            <div className="fee-pass-head">
              <div>
                <p className="fee-pass-org">CampusOne · {DEMO_STUDENT.department}</p>
                <p className="num fee-pass-roll">{DEMO_STUDENT.rollNumber}</p>
              </div>
              <span className="fee-pass-badge">Sem 5</span>
            </div>

            <div className="fee-pass-perforation" aria-hidden="true">
              <span className="fee-pass-notch fee-pass-notch--left" />
              <span className="fee-pass-dash" />
              <span className="fee-pass-notch fee-pass-notch--right" />
            </div>

            <div className="fee-pass-body">
              <p id="balance-heading" className="fee-pass-kicker">
                {outstanding.length === 0 ? 'Nothing outstanding' : 'Outstanding balance'}
              </p>
              <strong className="num fee-pass-amount">
                {formatPaise(totalOutstandingPaise).startsWith('₹') ? (
                  <>
                    <span className="fee-pass-currency">₹</span>
                    {formatPaise(totalOutstandingPaise).slice(1)}
                  </>
                ) : (
                  formatPaise(totalOutstandingPaise)
                )}
              </strong>

              {nextDueInvoice ? (
                <div className="fee-pass-deadline">
                  <div>
                    <span className="fee-pass-deadline-label">Payment deadline</span>
                    <strong className="fee-pass-deadline-date">
                      {formatCampusDate(nextDueInvoice.dueDate)}
                    </strong>
                  </div>
                  <span className="num fee-pass-deadline-pill">
                    {daysToNextDue !== null && daysToNextDue < 0
                      ? `Overdue by ${Math.abs(daysToNextDue)} ${Math.abs(daysToNextDue) === 1 ? 'day' : 'days'}`
                      : daysToNextDue === 0
                        ? 'Due today'
                        : `${daysToNextDue} ${daysToNextDue === 1 ? 'day' : 'days'} remaining`}
                  </span>
                </div>
              ) : (
                <p className="fee-pass-settled">
                  <Check size={16} aria-hidden="true" /> All semester invoices settled.
                </p>
              )}
            </div>
          </section>

          {nextDueInvoice ? (
            <Button
              variant="primary"
              className="mobile-only-pay-cta w-full"
              onClick={() => openPaymentReview(nextDueInvoice)}
            >
              Review and pay {formatPaise(getInvoiceTotalPaise(nextDueInvoice))}
            </Button>
          ) : (
            payments[0] && (
              <Button
                variant="secondary"
                className="mobile-only-pay-cta w-full"
                onClick={() => openReceipt(payments[0]!)}
              >
                View latest receipt
              </Button>
            )
          )}

          <section className="invoice-ledger" aria-label="Invoices">
            <SectionHeader
              title="Invoices"
              action={
                <span className="num text-[0.8125rem] text-muted-foreground">
                  {DEMO_INVOICES.length} items
                </span>
              }
            />
            <ul className="invoice-list">
              {DEMO_INVOICES.map((invoice) => {
                const payment = payments.find((item) => item.invoiceId === invoice.id);
                const overdue = !payment && invoice.dueDate < DEMO_TODAY_DATE;
                const isSelected = invoice.id === focusedInvoice.id;
                return (
                  <li key={invoice.id}>
                    <button
                      type="button"
                      className="fee-row press"
                      data-focused={isSelected}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectInvoiceRow(invoice)}
                    >
                      <span className="fee-row-copy">
                        <strong>{invoice.title}</strong>
                        <span className="invoice-due">
                          {payment
                            ? `Settled · ${formatShortDate(payment.paidAtIso)}`
                            : `Due ${formatShortDate(invoice.dueDate)}`}
                        </span>
                      </span>
                      <span className="fee-row-value">
                        <strong className="num">{formatPaise(getInvoiceTotalPaise(invoice))}</strong>
                        <StatusBadge
                          label={payment ? 'Paid' : overdue ? 'Overdue' : 'Unpaid'}
                          tone={payment ? 'success' : overdue ? 'error' : 'neutral'}
                        />
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="fees-detail-panel" aria-labelledby="selected-invoice-heading">
          <div className="detail-panel-head">
            <div>
              <p className="detail-kicker">
                {focusedPayment
                  ? `Paid ${formatCampusDate(focusedPayment.paidAtIso)}`
                  : `Due ${formatCampusDate(focusedInvoice.dueDate)}`}
              </p>
              <h2 id="selected-invoice-heading">{focusedInvoice.title}</h2>
            </div>
            <StatusBadge
              label={
                focusedPayment
                  ? 'Paid (Simulated)'
                  : focusedOverdue
                    ? 'Overdue'
                    : 'Pending'
              }
              tone={
                focusedPayment
                  ? 'success'
                  : focusedOverdue
                    ? 'error'
                    : 'warning'
              }
            />
          </div>

          <ul className="line-items">
            {focusedInvoice.lineItems.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <span className="line-item-dots" aria-hidden="true" />
                <span className="num font-medium">{formatPaise(item.amountPaise)}</span>
              </li>
            ))}
          </ul>

          <div className="detail-total-row">
            <span>Total</span>
            <strong className="num">{formatPaise(getInvoiceTotalPaise(focusedInvoice))}</strong>
          </div>

          <div className="detail-action-area">
            {focusedPayment ? (
              <div className="detail-paid-summary">
                <p>
                  Receipt <strong className="num">{focusedPayment.receiptNumber}</strong> via{' '}
                  {focusedPayment.methodLabel}
                </p>
                <Button variant="secondary" onClick={() => openReceipt(focusedPayment)}>
                  View receipt
                </Button>
              </div>
            ) : (
              <>
                <p className="detail-sim-note">
                  Simulated demonstration checkout only — no real money or payment credentials.
                </p>
                <Button variant="primary" onClick={() => openPaymentReview(focusedInvoice)}>
                  Review &amp; pay {formatPaise(getInvoiceTotalPaise(focusedInvoice))}
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>

      <section aria-labelledby="history-heading" className="history-section">
        <SectionHeader id="history-heading" title="Payment transactions" />
        {payments.length === 0 ? (
          <p className="history-empty">No payments recorded yet.</p>
        ) : (
          <ul className="history-list">
            {payments.map((payment) => {
              const invoice = DEMO_INVOICES.find((item) => item.id === payment.invoiceId);
              return (
                <li key={payment.id}>
                  <button
                    type="button"
                    className="history-row press"
                    aria-haspopup="dialog"
                    onClick={() => openReceipt(payment)}
                  >
                    <span className="history-check-icon" aria-hidden="true">
                      <Check size={16} strokeWidth={2.5} />
                    </span>
                    <span className="fee-row-copy">
                      <strong>{invoice?.title ?? payment.invoiceId}</strong>
                      <span>
                        {formatShortDate(payment.paidAtIso)} · {payment.methodLabel} ·{' '}
                        <span className="num">{payment.receiptNumber}</span>
                      </span>
                    </span>
                    <strong className="num history-amount">{formatPaise(payment.amountPaise)}</strong>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={dialogInvoice !== null}
        onClose={closeDialog}
        title={
          stage === 'invoice'
            ? 'Invoice details'
            : stage === 'receipt'
              ? 'Receipt'
              : stage === 'success'
                ? 'Payment complete'
                : stage === 'failure'
                  ? 'Payment didn’t go through'
                  : stage === 'processing'
                    ? 'Processing payment'
                    : 'Review payment'
        }
        description={
          stage === 'invoice' || stage === 'review' ? dialogInvoice?.title : undefined
        }
        footer={
          stage === 'invoice' && dialogInvoice ? (
            receipt ? (
              <Button variant="primary" onClick={() => openReceipt(receipt)}>
                View receipt
              </Button>
            ) : (
              <Button variant="primary" onClick={() => openPaymentReview(dialogInvoice)}>
                Review &amp; pay
              </Button>
            )
          ) : stage === 'review' ? (
            <>
              <Button variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmPayment}>
                Confirm simulated payment
              </Button>
            </>
          ) : stage === 'processing' ? (
            <Button variant="primary" disabled>
              Processing simulation…
            </Button>
          ) : stage === 'failure' ? (
            <>
              <Button variant="secondary" onClick={closeDialog}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setDemoOutcome('success');
                  setStage('review');
                }}
              >
                Retry
              </Button>
            </>
          ) : stage === 'success' ? (
            <>
              <Button variant="secondary" onClick={closeDialog}>
                Done
              </Button>
              <Button variant="primary" onClick={() => setStage('receipt')}>
                View receipt
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={closeDialog}>
              Done
            </Button>
          )
        }
      >
        {dialogInvoice && stage === 'invoice' && (
          <div className="dialog-stack">
            <p className="text-[0.875rem] text-muted-foreground">
              {receipt ? 'Paid (Simulated)' : `Due ${formatCampusDate(dialogInvoice.dueDate)}`}
            </p>
            <ul className="line-items">
              {dialogInvoice.lineItems.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <span className="line-item-dots" aria-hidden="true" />
                  <span className="num font-medium">{formatPaise(item.amountPaise)}</span>
                </li>
              ))}
            </ul>
            <div className="detail-total-row">
              <span>Invoice total</span>
              <strong className="num">{formatPaise(getInvoiceTotalPaise(dialogInvoice))}</strong>
            </div>
          </div>
        )}

        {dialogInvoice && stage === 'review' && (
          <div className="dialog-stack">
            <div className="sim-banner" role="note">
              <Info size={16} className="mt-px shrink-0" aria-hidden="true" />
              <span>
                <strong>Demo payment · No money will be transferred.</strong> No card or bank credentials are collected.
              </span>
            </div>

            <div className="review-hero-total">
              <p>{DEMO_STUDENT.department}</p>
              <strong className="num">{formatPaise(getInvoiceTotalPaise(dialogInvoice))}</strong>
              <span>{dialogInvoice.lineItems.length} items · {dialogInvoice.title}</span>
            </div>

            <fieldset className="sim-fieldset">
              <legend>Pay with</legend>
              <div className="sim-methods-card">
                {PAYMENT_METHODS.map((method, idx) => {
                  const Icon = method.icon;
                  const active = selectedMethod === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`sim-method-row ${idx > 0 ? 'border-t' : ''}`}
                      data-selected={active}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="sim-method"
                        value={method.id}
                        checked={active}
                        onChange={() => setSelectedMethod(method.id)}
                      />
                      <span className="sim-method-icon" data-selected={active}>
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[0.9375rem] font-medium">
                          {method.label}
                        </strong>
                        <span className="block text-[0.75rem] text-muted-foreground">
                          {method.detail}
                        </span>
                      </span>
                      <span className="sim-method-check" data-selected={active}>
                        {active && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <details className="demo-controls">
              <summary>
                <ChevronRight size={16} className="demo-controls-chevron" aria-hidden="true" />
                <span>Demo controls{demoOutcome === 'failure' ? ' · Decline selected' : ''}</span>
              </summary>
              <div className="pt-2">
                <SegmentedControl
                  label="Simulated payment outcome"
                  value={demoOutcome}
                  onChange={setDemoOutcome}
                  options={[
                    { value: 'success', label: 'Successful payment' },
                    { value: 'failure', label: 'Declined payment' },
                  ]}
                />
              </div>
            </details>
          </div>
        )}

        {dialogInvoice && stage === 'processing' && (
          <div className="dialog-status-state" role="status" aria-live="polite">
            <Loader2 size={36} className="animate-spin text-cobalt" aria-hidden="true" />
            <strong>Confirming with {selectedMethod}…</strong>
            <p>Simulated · please keep this open</p>
          </div>
        )}

        {dialogInvoice && stage === 'failure' && (
          <div className="dialog-status-state" role="alert">
            <span className="status-badge-circle status-badge-circle--error" aria-hidden="true">
              <TriangleAlert size={26} />
            </span>
            <strong>Payment didn’t go through</strong>
            <p>
              {selectedMethod} declined the simulated attempt. Your balance is still{' '}
              <span className="num font-semibold">{formatPaise(totalOutstandingPaise)}</span>.
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'success' && receipt && (
          <div className="fee-success" role="status">
            <svg className="fee-success-mark" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="26" />
              <path d="M17 29.5 24.5 37 39.5 21" />
            </svg>
            <p className="fee-success-kicker">Paid · Simulated</p>
            <strong className="num fee-success-amount">{formatPaise(receipt.amountPaise)}</strong>
            <p className="fee-success-line">
              {dialogInvoice.title} is settled.{' '}
              {totalOutstandingPaise === 0 ? (
                'Nothing else is due this semester.'
              ) : (
                <>
                  <span className="num font-semibold">{formatPaise(totalOutstandingPaise)}</span> is still due.
                </>
              )}
            </p>
            <dl className="fee-success-stub">
              <div>
                <dt>Receipt</dt>
                <dd className="num">{receipt.receiptNumber}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{receipt.methodLabel}</dd>
              </div>
            </dl>
          </div>
        )}

        {dialogInvoice && stage === 'receipt' && receipt && (
          <div className="receipt-sheet">
            <div className="receipt-summary-card">
              <p className="text-[0.8125rem] text-muted-foreground">{dialogInvoice.title}</p>
              <strong className="num">{formatPaise(receipt.amountPaise)}</strong>
              <span className="receipt-paid-pill">
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                Paid · Simulated
              </span>
            </div>
            <div className="receipt-badge-row">
              <ReceiptText size={16} aria-hidden="true" />
              <span>Simulated receipt · Not a tax document</span>
            </div>
            <dl className="receipt-dl">
              <div>
                <dt>Receipt no.</dt>
                <dd className="num">{receipt.receiptNumber}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatCampusDate(receipt.paidAtIso)}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{receipt.methodLabel}</dd>
              </div>
              <div>
                <dt>Student</dt>
                <dd>
                  {DEMO_STUDENT.name} · {DEMO_STUDENT.rollNumber}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
    </div>
  );
}
