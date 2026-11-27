import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, ReceiptText, TriangleAlert } from 'lucide-react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
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
  'UPI',
  'Net banking',
  'Debit card',
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
  const receipt = activeReceipt ?? payments.find((payment) => payment.invoiceId === dialogInvoiceId);

  function openInvoice(invoice: FeeInvoice) {
    setSearchParams({ invoice: invoice.id }, { replace: true });
    setDialogInvoiceId(invoice.id);
    setActiveReceipt(null);
    setStage('invoice');
  }

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
      <PageHeader title="Fees & Payments" />

      {storageFailed && (
        <p className="fees-storage-note" role="status">
          Browser storage is unavailable; simulated payment changes apply to this session only.
        </p>
      )}

      <div className="fees-top-grid">
        <section className="balance-panel" aria-labelledby="balance-heading">
          <div className="balance-head">
            <span id="balance-heading" className="balance-kicker">
              Outstanding balance
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
              {daysToNextDue !== null && daysToNextDue < 0
                ? `Overdue since ${formatShortDate(nextDueInvoice.dueDate)}`
                : `Due ${formatCampusDate(nextDueInvoice.dueDate)}`}
            </p>
          ) : (
            <p className="balance-due">You’re all paid up.</p>
          )}

          {nextDueInvoice ? (
            <Button variant="primary" onClick={() => openPaymentReview(nextDueInvoice)}>
              Pay {formatPaise(getInvoiceTotalPaise(nextDueInvoice))}
            </Button>
          ) : (
            payments[0] && (
              <Button variant="secondary" onClick={() => openReceipt(payments[0]!)}>
                View latest receipt
              </Button>
            )
          )}
        </section>

        <section className="invoice-ledger" aria-label="Invoices">
          <SectionHeader title="Invoices" />
          <ul className="invoice-list">
            {DEMO_INVOICES.map((invoice) => {
              const payment = payments.find((item) => item.invoiceId === invoice.id);
              const overdue = !payment && invoice.dueDate < DEMO_TODAY_DATE;
              return (
                <li key={invoice.id}>
                  <button type="button" className="fee-row invoice-card" data-focused={invoice.id === focusedInvoice.id}
                    aria-haspopup="dialog" onClick={() => openInvoice(invoice)}>
                    <span className="fee-row-copy">
                      <strong>{invoice.title}</strong>
                      <span className="invoice-due">Due {formatShortDate(invoice.dueDate)}</span>
                    </span>
                    <span className="fee-row-value">
                      <strong className="tabular-nums">{formatPaise(getInvoiceTotalPaise(invoice))}</strong>
                      <StatusBadge label={payment ? 'Paid' : overdue ? 'Overdue' : 'Unpaid'} tone={payment ? 'success' : overdue ? 'error' : 'neutral'} />
                    </span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="history-heading" className="history-section">
        <h2 id="history-heading" className="section-title">Payment history</h2>
        {payments.length === 0 ? <p className="history-empty">No payments yet.</p> : (
          <ul className="history-list">
            {payments.map((payment) => {
              const invoice = DEMO_INVOICES.find((item) => item.id === payment.invoiceId);
              return (
                <li key={payment.id}>
                  <button type="button" className="fee-row history-row" aria-haspopup="dialog" onClick={() => openReceipt(payment)}>
                    <span className="fee-row-copy">
                      <strong>{invoice?.title ?? payment.invoiceId}</strong>
                      <span>{formatCampusDate(payment.paidAtIso)} · {payment.methodLabel}</span>
                      <span className="tabular-nums">{payment.receiptNumber}</span>
                    </span>
                    <strong className="tabular-nums">{formatPaise(payment.amountPaise)}</strong>
                    <ChevronRight size={16} aria-hidden="true" />
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
        title={stage === 'invoice' ? 'Invoice details'
          : stage === 'receipt' ? 'Payment receipt'
          : stage === 'success' ? 'Payment complete'
          : stage === 'failure' ? 'Payment declined'
          : stage === 'processing' ? 'Processing payment'
          : 'Review payment'}
        description={dialogInvoice?.title}
        footer={
          stage === 'invoice' && dialogInvoice ? (
            receipt ? <Button variant="primary" onClick={() => openReceipt(receipt)}>View receipt</Button>
              : <Button variant="primary" onClick={() => openPaymentReview(dialogInvoice)}>Review payment</Button>
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
            <p>{receipt ? 'Paid' : `Due ${formatCampusDate(dialogInvoice.dueDate)}`}</p>
            <ul className="line-items">
              {dialogInvoice.lineItems.map((item) => (
                <li key={item.id}><span>{item.label}</span><span className="tabular-nums">{formatPaise(item.amountPaise)}</span></li>
              ))}
            </ul>
            <div className="review-summary"><span>Invoice total</span><strong className="tabular-nums">{formatPaise(getInvoiceTotalPaise(dialogInvoice))}</strong></div>
          </div>
        )}

        {dialogInvoice && stage === 'review' && (
          <div className="dialog-stack">
            <div className="sim-banner" role="note">
              <strong>Simulated payment.</strong> No money will be charged. You won’t enter any payment credentials.
            </div>

            <div className="review-summary">
              <span>Invoice total</span>
              <strong className="tabular-nums">
                {formatPaise(getInvoiceTotalPaise(dialogInvoice))}
              </strong>
            </div>

            <fieldset className="sim-fieldset">
              <legend>Payment method</legend>
              {PAYMENT_METHODS.map((method) => (
                <label key={method} className="sim-radio-row">
                  <input
                    className="sr-only"
                    type="radio"
                    name="sim-method"
                    value={method}
                    checked={selectedMethod === method}
                    onChange={() => setSelectedMethod(method)}
                  />
                  <span>{method}</span>
                  {selectedMethod === method && <Check size={18} aria-hidden="true" />}
                </label>
              ))}
            </fieldset>

            <details className="demo-controls">
              <summary>Demo controls{demoOutcome === 'failure' ? ' · Decline selected' : ''}</summary>
              <fieldset className="sim-fieldset">
                <legend>Payment outcome</legend>
                <label className="sim-radio-row">
                  <input
                    type="radio"
                    name="demo-outcome"
                    value="success"
                    checked={demoOutcome === 'success'}
                    onChange={() => setDemoOutcome('success')}
                  />
                  <span>Successful payment</span>
                </label>
                <label className="sim-radio-row">
                  <input
                    type="radio"
                    name="demo-outcome"
                    value="failure"
                    checked={demoOutcome === 'failure'}
                    onChange={() => setDemoOutcome('failure')}
                  />
                  <span>Declined payment</span>
                </label>
              </fieldset>
            </details>
          </div>
        )}

        {dialogInvoice && stage === 'processing' && (
          <div className="dialog-status-state" role="status" aria-live="polite">
            <p className="font-semibold text-text-primary">
              Processing your simulated payment…
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'failure' && (
          <div className="dialog-status-state" role="alert">
            <div className="status-icon-row text-error">
              <TriangleAlert size={20} aria-hidden="true" />
              <strong>Simulated payment declined</strong>
            </div>
            <p className="text-text-secondary">
              You can try again. Your balance is still {formatPaise(totalOutstandingPaise)}.
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'success' && receipt && (
          <div className="dialog-status-state" role="status">
            <div className="payment-check" aria-hidden="true"><Check size={30} /></div>
            <strong className="payment-success-amount tabular-nums">{formatPaise(receipt.amountPaise)}</strong>
            <p className="text-text-secondary">
              Receipt <span className="tabular-nums font-semibold">{receipt.receiptNumber}</span>{' '}
              is saved for this simulated payment.
            </p>
          </div>
        )}

        {dialogInvoice && stage === 'receipt' && receipt && (
          <div className="receipt-sheet">
            <div className="receipt-badge-row">
              <ReceiptText size={18} aria-hidden="true" />
              <span>Simulated receipt · Not a tax document</span>
            </div>
            <dl className="receipt-dl">
              <div>
                <dt>Receipt ID</dt>
                <dd className="tabular-nums">{receipt.receiptNumber}</dd>
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
                <dd>{formatCampusDate(receipt.paidAtIso)}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{receipt.methodLabel}</dd>
              </div>
              <div>
                <dt>Amount paid</dt>
                <dd className="tabular-nums font-semibold">
                  {formatPaise(receipt.amountPaise)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
    </div>
  );
}
