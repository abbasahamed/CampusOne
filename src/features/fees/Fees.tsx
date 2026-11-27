import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ReceiptText, TriangleAlert } from 'lucide-react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader, SectionHeader } from '../../components/Typography';
import { DEMO_INVOICES, DEMO_STUDENT, DEMO_TODAY_DATE } from '../../data/demoData';
import type { FeeInvoice, FeePayment } from '../../data/types';
import { formatCampusDate, formatPaise, formatShortDate } from '../../domain/format';
import { getInvoiceTotalPaise, getOutstandingInvoices } from '../../domain/selectors';
import './fees.css';

type PaymentDialogStage = 'review' | 'processing' | 'success' | 'failure' | 'receipt';
type DemoOutcome = 'success' | 'failure';

const PAYMENT_METHODS = [
  'UPI · Demo ID',
  'Campus NetBanking (Demo)',
  'Debit Card (Demo)',
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
  const [selectedMethod, setSelectedMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [demoOutcome, setDemoOutcome] = useState<DemoOutcome>('success');
  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null);

  const dialogInvoice = DEMO_INVOICES.find((inv) => inv.id === dialogInvoiceId) ?? null;

  useEffect(() => {
    if (stage !== 'processing' || !dialogInvoice) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReduced ? 60 : 450;

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
    ? Math.round((Date.parse(nextDueInvoice.dueDate) - Date.parse(DEMO_TODAY_DATE)) / 86_400_000)
    : null;

  return (
    <div className="fees-page">
      <PageHeader
        eyebrow={`Finance · ${DEMO_STUDENT.rollNumber}`}
        title="Fees & Payments"
        subtitle="Itemized university invoices, payment history and simulated demo checkout."
      />

      {storageFailed && (
        <p className="fees-storage-note" role="status">
          Browser storage is unavailable; simulated payment changes apply to this session only.
        </p>
      )}

      <div className="fees-top-grid">
        <section className="balance-panel" aria-labelledby="balance-heading">
          <div className="balance-head">
            <span id="balance-heading" className="balance-kicker">
              Total outstanding balance
            </span>
            <StatusBadge
              label={
                outstanding.length === 0
                  ? 'All settled'
                  : daysToNextDue !== null && daysToNextDue < 0
                    ? 'Overdue'
                    : 'Due soon'
              }
              tone={
                outstanding.length === 0
                  ? 'success'
                  : daysToNextDue !== null && daysToNextDue < 0
                    ? 'error'
                    : 'warning'
              }
            />
          </div>

          <strong className="balance-amount tabular-nums">
            {formatPaise(totalOutstandingPaise)}
          </strong>

          {nextDueInvoice ? (
            <p className="balance-due">
              {nextDueInvoice.title} ·{' '}
              {daysToNextDue !== null && daysToNextDue < 0
                ? `Overdue since ${formatShortDate(nextDueInvoice.dueDate)}`
                : `Due ${formatCampusDate(nextDueInvoice.dueDate)}`}
            </p>
          ) : (
            <p className="balance-due">No unpaid invoices remain for {DEMO_STUDENT.rollNumber}.</p>
          )}

          {nextDueInvoice ? (
            <Button variant="primary" onClick={() => openPaymentReview(nextDueInvoice)}>
              Review & pay {formatPaise(getInvoiceTotalPaise(nextDueInvoice))}
            </Button>
          ) : (
            payments[0] && (
              <Button variant="secondary" onClick={() => openReceipt(payments[0]!)}>
                View latest receipt
              </Button>
            )
          )}
        </section>

        <section aria-labelledby="invoices-heading" className="invoice-ledger">
          <SectionHeader title="Invoices" supporting="Select an invoice to inspect line items." />
          <div className="invoice-list">
            {DEMO_INVOICES.map((invoice) => {
              const payment = payments.find((p) => p.invoiceId === invoice.id);
              const totalPaise = getInvoiceTotalPaise(invoice);
              const isFocused = invoice.id === focusedInvoice.id;
              const isOverdue =
                !payment && Date.parse(invoice.dueDate) < Date.parse(DEMO_TODAY_DATE);

              return (
                <article
                  key={invoice.id}
                  className="invoice-card"
                  data-focused={isFocused}
                  onClick={() => setSearchParams({ invoice: invoice.id }, { replace: true })}
                >
                  <div className="invoice-card-head">
                    <div>
                      <h3>{invoice.title}</h3>
                      <p className="invoice-due">
                        Due {formatCampusDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="invoice-card-right">
                      <strong className="tabular-nums">{formatPaise(totalPaise)}</strong>
                      <StatusBadge
                        label={payment ? 'Paid (Simulated)' : isOverdue ? 'Overdue' : 'Pending'}
                        tone={payment ? 'success' : isOverdue ? 'error' : 'warning'}
                      />
                    </div>
                  </div>

                  <ul className="line-items">
                    {invoice.lineItems.map((li) => (
                      <li key={li.id}>
                        <span>{li.label}</span>
                        <span className="tabular-nums">{formatPaise(li.amountPaise)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="invoice-actions">
                    {payment ? (
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReceipt(payment);
                        }}
                      >
                        View receipt
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPaymentReview(invoice);
                        }}
                      >
                        Review payment
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section aria-labelledby="history-heading" className="history-section">
        <h2 id="history-heading" className="section-title">
          Payment history
        </h2>
        {payments.length === 0 ? (
          <p className="history-empty">No payments recorded yet.</p>
        ) : (
          <ul className="history-list">
            {payments.map((payment) => {
              const inv = DEMO_INVOICES.find((i) => i.id === payment.invoiceId);
              return (
                <li key={payment.id} className="history-row">
                  <div className="history-copy">
                    <strong>{inv?.title ?? payment.invoiceId}</strong>
                    <span className="tabular-nums">
                      {payment.receiptNumber} · {formatCampusDate(payment.paidAtIso)} ·{' '}
                      {payment.methodLabel}
                    </span>
                  </div>
                  <div className="history-right">
                    <strong className="tabular-nums">{formatPaise(payment.amountPaise)}</strong>
                    <Button variant="secondary" onClick={() => openReceipt(payment)}>
                      Receipt
                    </Button>
                  </div>
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
          stage === 'receipt' || stage === 'success'
            ? 'Simulated Payment Receipt'
            : stage === 'failure'
              ? 'Simulated Payment Declined'
              : 'Review Simulated Payment'
        }
        description={
          dialogInvoice
            ? `${dialogInvoice.title} · Demonstration workflow only`
            : undefined
        }
        footer={
          stage === 'review' ? (
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
              <Button variant="primary" onClick={() => setStage('review')}>
                Retry payment
              </Button>
            </>
          ) : stage === 'success' ? (
            <>
              <Button variant="secondary" onClick={closeDialog}>
                Done
              </Button>
              <Button variant="primary" onClick={() => setStage('receipt')}>
                View full receipt
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={closeDialog}>
              Close receipt
            </Button>
          )
        }
      >
        {dialogInvoice && stage === 'review' && (
          <div className="dialog-stack">
            <div className="sim-banner" role="note">
              <strong>Simulated payment</strong> — No real money moves and no UPI PIN, card number,
              or bank credentials are collected.
            </div>

            <div className="review-summary">
              <span>Invoice total</span>
              <strong className="tabular-nums">
                {formatPaise(getInvoiceTotalPaise(dialogInvoice))}
              </strong>
            </div>

            <fieldset className="sim-fieldset">
              <legend>Simulated method</legend>
              {PAYMENT_METHODS.map((method) => (
                <label key={method} className="sim-radio-row">
                  <input
                    type="radio"
                    name="sim-method"
                    value={method}
                    checked={selectedMethod === method}
                    onChange={() => setSelectedMethod(method)}
                  />
                  <span>{method}</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="sim-fieldset">
              <legend>Demo outcome control</legend>
              <label className="sim-radio-row">
                <input
                  type="radio"
                  name="demo-outcome"
                  value="success"
                  checked={demoOutcome === 'success'}
                  onChange={() => setDemoOutcome('success')}
                />
                <span>Simulate success (Default)</span>
              </label>
              <label className="sim-radio-row">
                <input
                  type="radio"
                  name="demo-outcome"
                  value="failure"
                  checked={demoOutcome === 'failure'}
                  onChange={() => setDemoOutcome('failure')}
                />
                <span>Simulate gateway failure</span>
              </label>
            </fieldset>
          </div>
        )}

        {dialogInvoice && stage === 'processing' && (
          <div className="dialog-status-state" role="status" aria-live="polite">
            <p className="font-semibold text-text-primary">
              Verifying simulated {selectedMethod} authorization…
            </p>
            <p className="text-text-secondary">
              Duplicate submissions are locked until the simulation settles.
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'failure' && (
          <div className="dialog-status-state" role="alert">
            <div className="status-icon-row text-error">
              <TriangleAlert size={20} aria-hidden="true" />
              <strong>Authorization declined (Simulated failure)</strong>
            </div>
            <p className="text-text-secondary">
              The simulated gateway rejected the request. No payment record was created, and your
              outstanding balance remains {formatPaise(totalOutstandingPaise)}.
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'success' && activeReceipt && (
          <div className="dialog-status-state" role="status">
            <div className="status-icon-row text-success">
              <CheckCircle2 size={20} aria-hidden="true" />
              <strong>Simulated payment recorded</strong>
            </div>
            <p className="text-text-secondary">
              Receipt <span className="tabular-nums font-semibold">{activeReceipt.receiptNumber}</span>{' '}
              is saved. Your outstanding balance and Today action centre have updated.
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'receipt' && activeReceipt && (
          <div className="receipt-sheet">
            <div className="receipt-badge-row">
              <ReceiptText size={18} aria-hidden="true" />
              <span>Simulated Demo Receipt · Not a tax document</span>
            </div>
            <dl className="receipt-dl">
              <div>
                <dt>Receipt ID</dt>
                <dd className="tabular-nums">{activeReceipt.receiptNumber}</dd>
              </div>
              <div>
                <dt>Student</dt>
                <dd>
                  {DEMO_STUDENT.name} ({DEMO_STUDENT.rollNumber})
                </dd>
              </div>
              <div>
                <dt>Invoice</dt>
                <dd>{dialogInvoice.title}</dd>
              </div>
              <div>
                <dt>Paid date</dt>
                <dd>{formatCampusDate(activeReceipt.paidAtIso)}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{activeReceipt.methodLabel}</dd>
              </div>
              <div>
                <dt>Amount paid</dt>
                <dd className="tabular-nums font-semibold">
                  {formatPaise(activeReceipt.amountPaise)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
    </div>
  );
}
